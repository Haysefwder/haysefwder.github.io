"use server";

import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { gameMasterService, type GameMasterCharacterSnapshot } from "@/lib/gameMaster";
import {
  rollDice,
  formatRollOutcome,
  isDiceType,
  MAX_DICE_QUANTITY,
  MAX_DICE_MODIFIER,
} from "@/lib/dice";
import type { Campaign, Character, DiceType, MessageSender } from "@prisma/client";

export interface CampaignFormState {
  error?: string;
}

function toSnapshot(character: Character): GameMasterCharacterSnapshot {
  return {
    name: character.name,
    race: character.race,
    class: character.class,
    level: character.level,
    hpCurrent: character.hpCurrent,
    hpMax: character.hpMax,
    gold: character.gold,
  };
}

export async function getOwnedCampaign(
  userId: string,
  campaignId: string
): Promise<Campaign & { character: Character }> {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, userId },
    include: { character: true },
  });

  if (!campaign) {
    notFound();
  }

  return campaign;
}

/** Starts a brand-new campaign for a character that doesn't have one yet. */
export async function startCampaignAction(
  characterId: string,
  _prevState: CampaignFormState,
  formData: FormData
): Promise<CampaignFormState> {
  const user = await requireUser();

  const character = await prisma.character.findFirst({
    where: { id: characterId, userId: user.id },
    include: { campaign: true },
  });

  if (!character) {
    notFound();
  }

  if (character.campaign) {
    redirect(`/campaign/${character.campaign.id}`);
  }

  const title =
    String(formData.get("title") ?? "").trim() || `A Jornada de ${character.name}`;

  const intro = await gameMasterService.introduceCampaign(toSnapshot(character), title);

  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      characterId: character.id,
      title,
      summary: intro.summary,
      messages: {
        create: { sender: "GM", content: intro.narration },
      },
      journalEntries: {
        create: intro.journalEntries.map((entry) => ({
          type: entry.type,
          title: entry.title,
          description: entry.description,
        })),
      },
    },
  });

  redirect(`/campaign/${campaign.id}`);
}

export interface ChatMessageView {
  id: string;
  sender: MessageSender;
  content: string;
  createdAt: string;
}

export interface SendMessageResult {
  error?: string;
  playerMessage?: ChatMessageView;
  gmMessage?: ChatMessageView;
  character?: { hpCurrent: number; gold: number };
}

/** Sends the player's message and lets the Game Master Service respond. */
export async function sendMessageAction(
  campaignId: string,
  content: string
): Promise<SendMessageResult> {
  const user = await requireUser();
  const trimmed = content.trim();

  if (!trimmed) {
    return { error: "Escreva uma mensagem antes de enviar." };
  }
  if (trimmed.length > 2000) {
    return { error: "Mensagem muito longa (máximo de 2000 caracteres)." };
  }

  const campaign = await getOwnedCampaign(user.id, campaignId);
  const character = campaign.character;

  const recentMessages = await prisma.message.findMany({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  recentMessages.reverse();

  const latestDiceRoll = await prisma.diceRoll.findFirst({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });

  const lastGmMessage = recentMessages.findLast((message) => message.sender === "GM");
  const freshDiceRoll =
    latestDiceRoll && (!lastGmMessage || latestDiceRoll.createdAt > lastGmMessage.createdAt)
      ? latestDiceRoll
      : null;

  const turnResult = await gameMasterService.takeTurn({
    character: toSnapshot(character),
    campaignTitle: campaign.title,
    campaignSummary: campaign.summary,
    recentMessages: recentMessages.map((message) => ({
      sender: message.sender,
      content: message.content,
    })),
    playerMessage: trimmed,
    lastDiceRoll: freshDiceRoll
      ? {
          description: formatRollOutcome({
            diceType: freshDiceRoll.diceType,
            quantity: freshDiceRoll.quantity,
            modifier: freshDiceRoll.modifier,
            results: freshDiceRoll.results,
            total: freshDiceRoll.total,
          }),
          total: freshDiceRoll.total,
        }
      : null,
  });

  const change = turnResult.characterStateChange;
  let hpCurrent = character.hpCurrent;
  let gold = character.gold;

  if (change?.hpDelta || change?.goldDelta) {
    hpCurrent = Math.min(character.hpMax, Math.max(0, character.hpCurrent + (change.hpDelta ?? 0)));
    gold = Math.max(0, character.gold + (change.goldDelta ?? 0));

    await prisma.character.update({
      where: { id: character.id },
      data: { hpCurrent, gold },
    });
  }

  const playerMessage = await prisma.message.create({
    data: { campaignId, sender: "PLAYER", content: trimmed },
  });
  const gmMessage = await prisma.message.create({
    data: { campaignId, sender: "GM", content: turnResult.narration },
  });

  if (turnResult.journalEntries.length > 0) {
    await prisma.journalEntry.createMany({
      data: turnResult.journalEntries.map((entry) => ({
        campaignId,
        type: entry.type,
        title: entry.title,
        description: entry.description,
      })),
    });
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { summary: turnResult.summary },
  });

  revalidatePath(`/campaign/${campaignId}`);
  revalidatePath(`/campaign/${campaignId}/journal`);
  revalidatePath(`/characters/${character.id}`);

  return {
    playerMessage: {
      id: playerMessage.id,
      sender: playerMessage.sender,
      content: playerMessage.content,
      createdAt: playerMessage.createdAt.toISOString(),
    },
    gmMessage: {
      id: gmMessage.id,
      sender: gmMessage.sender,
      content: gmMessage.content,
      createdAt: gmMessage.createdAt.toISOString(),
    },
    character: { hpCurrent, gold },
  };
}

export interface DiceRollView {
  id: string;
  diceType: DiceType;
  quantity: number;
  modifier: number;
  results: number[];
  total: number;
  label: string | null;
  createdAt: string;
}

export interface RollDiceResult {
  error?: string;
  roll?: DiceRollView;
}

/** Rolls dice on behalf of the player and stores the result in the roll history. */
export async function rollDiceAction(
  campaignId: string,
  diceType: string,
  quantity: number,
  modifier: number,
  label?: string
): Promise<RollDiceResult> {
  const user = await requireUser();
  await getOwnedCampaign(user.id, campaignId);

  if (!isDiceType(diceType)) {
    return { error: "Tipo de dado inválido." };
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_DICE_QUANTITY) {
    return { error: `A quantidade de dados deve ser entre 1 e ${MAX_DICE_QUANTITY}.` };
  }
  if (!Number.isInteger(modifier) || Math.abs(modifier) > MAX_DICE_MODIFIER) {
    return { error: `O modificador deve estar entre -${MAX_DICE_MODIFIER} e ${MAX_DICE_MODIFIER}.` };
  }

  const outcome = rollDice(diceType, quantity, modifier);

  const roll = await prisma.diceRoll.create({
    data: {
      userId: user.id,
      campaignId,
      diceType,
      quantity,
      modifier,
      results: outcome.results,
      total: outcome.total,
      label: label?.trim() || null,
    },
  });

  revalidatePath(`/campaign/${campaignId}`);

  return {
    roll: {
      id: roll.id,
      diceType: roll.diceType,
      quantity: roll.quantity,
      modifier: roll.modifier,
      results: roll.results,
      total: roll.total,
      label: roll.label,
      createdAt: roll.createdAt.toISOString(),
    },
  };
}

/** Marks an active quest from the campaign journal as completed. */
export async function completeQuestAction(campaignId: string, journalEntryId: string): Promise<void> {
  const user = await requireUser();
  await getOwnedCampaign(user.id, campaignId);

  await prisma.journalEntry.updateMany({
    where: { id: journalEntryId, campaignId, type: "QUEST" },
    data: { status: "COMPLETED" },
  });

  revalidatePath(`/campaign/${campaignId}/journal`);
}
