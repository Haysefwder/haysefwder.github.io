"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { Character } from "@prisma/client";

export interface CharacterFormState {
  error?: string;
}

const ATTRIBUTE_FIELDS = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
] as const;

interface ParsedCharacterInput {
  name: string;
  race: string;
  class: string;
  level: number;
  hpMax: number;
  hpCurrent: number;
  gold: number;
  attributes: Record<(typeof ATTRIBUTE_FIELDS)[number], number>;
}

function parseRequiredInt(
  formData: FormData,
  field: string,
  min: number,
  max: number
): number | null {
  const raw = formData.get(field);
  if (raw === null || raw === "") return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) return null;
  return value;
}

function parseCharacterInput(formData: FormData): ParsedCharacterInput | { error: string } {
  const name = String(formData.get("name") ?? "").trim();
  const race = String(formData.get("race") ?? "").trim();
  const characterClass = String(formData.get("class") ?? "").trim();

  if (!name || !race || !characterClass) {
    return { error: "Preencha nome, raça e classe." };
  }

  const level = parseRequiredInt(formData, "level", 1, 20);
  if (level === null) {
    return { error: "Nível deve ser um número entre 1 e 20." };
  }

  const hpMax = parseRequiredInt(formData, "hpMax", 1, 999);
  if (hpMax === null) {
    return { error: "Pontos de vida máximos devem ser um número entre 1 e 999." };
  }

  let hpCurrent = parseRequiredInt(formData, "hpCurrent", 0, hpMax);
  if (hpCurrent === null) {
    hpCurrent = hpMax;
  }

  const gold = parseRequiredInt(formData, "gold", 0, 1_000_000);
  if (gold === null) {
    return { error: "Ouro deve ser um número maior ou igual a 0." };
  }

  const attributes: Record<(typeof ATTRIBUTE_FIELDS)[number], number> = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  };

  for (const field of ATTRIBUTE_FIELDS) {
    const value = parseRequiredInt(formData, field, 1, 30);
    if (value === null) {
      return { error: "Cada atributo deve ser um número entre 1 e 30." };
    }
    attributes[field] = value;
  }

  return {
    name,
    race,
    class: characterClass,
    level,
    hpMax,
    hpCurrent,
    gold,
    attributes,
  };
}

export async function getOwnedCharacter(userId: string, characterId: string): Promise<
  Character & {
    inventory: { id: string; name: string; quantity: number; description: string | null }[];
    campaign: { id: string; title: string; status: string } | null;
  }
> {
  const character = await prisma.character.findFirst({
    where: { id: characterId, userId },
    include: {
      inventory: { orderBy: { createdAt: "asc" } },
      campaign: { select: { id: true, title: true, status: true } },
    },
  });

  if (!character) {
    notFound();
  }

  return character;
}

export async function createCharacterAction(
  _prevState: CharacterFormState,
  formData: FormData
): Promise<CharacterFormState> {
  const user = await requireUser();

  const parsed = parseCharacterInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  const character = await prisma.character.create({
    data: {
      userId: user.id,
      name: parsed.name,
      race: parsed.race,
      class: parsed.class,
      level: parsed.level,
      hpMax: parsed.hpMax,
      hpCurrent: parsed.hpCurrent,
      gold: parsed.gold,
      ...parsed.attributes,
    },
  });

  redirect(`/characters/${character.id}`);
}

export async function updateCharacterAction(
  characterId: string,
  _prevState: CharacterFormState,
  formData: FormData
): Promise<CharacterFormState> {
  const user = await requireUser();
  await getOwnedCharacter(user.id, characterId);

  const parsed = parseCharacterInput(formData);
  if ("error" in parsed) {
    return { error: parsed.error };
  }

  await prisma.character.update({
    where: { id: characterId },
    data: {
      name: parsed.name,
      race: parsed.race,
      class: parsed.class,
      level: parsed.level,
      hpMax: parsed.hpMax,
      hpCurrent: parsed.hpCurrent,
      gold: parsed.gold,
      ...parsed.attributes,
    },
  });

  revalidatePath(`/characters/${characterId}`);
  return {};
}

export async function addInventoryItemAction(
  characterId: string,
  formData: FormData
): Promise<void> {
  const user = await requireUser();
  await getOwnedCharacter(user.id, characterId);

  const name = String(formData.get("itemName") ?? "").trim();
  if (!name) {
    revalidatePath(`/characters/${characterId}`);
    return;
  }

  const quantityRaw = Number(formData.get("itemQuantity"));
  const quantity = Number.isInteger(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
  const description = String(formData.get("itemDescription") ?? "").trim() || null;

  await prisma.inventoryItem.create({
    data: { characterId, name, quantity, description },
  });

  revalidatePath(`/characters/${characterId}`);
}

export async function deleteInventoryItemAction(
  characterId: string,
  itemId: string
): Promise<void> {
  const user = await requireUser();
  await getOwnedCharacter(user.id, characterId);

  await prisma.inventoryItem.deleteMany({
    where: { id: itemId, characterId },
  });

  revalidatePath(`/characters/${characterId}`);
}
