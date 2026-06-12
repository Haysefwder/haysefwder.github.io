import { requireUser } from "@/lib/auth";
import { getOwnedCampaign, type ChatMessageView, type DiceRollView } from "@/lib/actions/campaigns";
import { prisma } from "@/lib/prisma";
import CampaignPlayClient from "@/components/CampaignPlayClient";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const campaign = await getOwnedCampaign(user.id, id);
  const character = campaign.character;

  const [messages, diceRolls] = await Promise.all([
    prisma.message.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.diceRoll.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const initialMessages: ChatMessageView[] = messages.map((message) => ({
    id: message.id,
    sender: message.sender,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }));

  const initialRolls: DiceRollView[] = diceRolls.map((roll) => ({
    id: roll.id,
    diceType: roll.diceType,
    quantity: roll.quantity,
    modifier: roll.modifier,
    results: roll.results,
    total: roll.total,
    label: roll.label,
    createdAt: roll.createdAt.toISOString(),
  }));

  return (
    <CampaignPlayClient
      campaignId={campaign.id}
      campaignTitle={campaign.title}
      character={{
        id: character.id,
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        hpMax: character.hpMax,
        hpCurrent: character.hpCurrent,
        gold: character.gold,
      }}
      initialMessages={initialMessages}
      initialRolls={initialRolls}
    />
  );
}
