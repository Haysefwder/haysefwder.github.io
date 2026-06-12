"use client";

import { useState } from "react";
import Link from "next/link";
import ChatPanel from "@/components/ChatPanel";
import DiceRoller from "@/components/DiceRoller";
import LogoutButton from "@/components/LogoutButton";
import type { ChatMessageView, DiceRollView } from "@/lib/actions/campaigns";

interface CampaignPlayClientProps {
  campaignId: string;
  campaignTitle: string;
  character: {
    id: string;
    name: string;
    race: string;
    class: string;
    level: number;
    hpMax: number;
    hpCurrent: number;
    gold: number;
  };
  initialMessages: ChatMessageView[];
  initialRolls: DiceRollView[];
}

export default function CampaignPlayClient({
  campaignId,
  campaignTitle,
  character,
  initialMessages,
  initialRolls,
}: CampaignPlayClientProps) {
  const [stats, setStats] = useState({ hpCurrent: character.hpCurrent, gold: character.gold });

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 lg:flex-row">
      <aside className="flex flex-col gap-4 lg:w-72 lg:shrink-0">
        <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
          <h1 className="text-lg font-bold text-stone-50">{campaignTitle}</h1>
          <p className="text-sm text-stone-400">
            {character.name} — {character.race} {character.class} (Nível {character.level})
          </p>

          <div className="mt-3 space-y-1 text-sm text-stone-300">
            <p>
              PV: {stats.hpCurrent}/{character.hpMax}
            </p>
            <p>Ouro: {stats.gold}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link href={`/characters/${character.id}`} className="text-amber-400 hover:text-amber-300">
              Ver ficha completa
            </Link>
            <Link href={`/campaign/${campaignId}/journal`} className="text-amber-400 hover:text-amber-300">
              Diário da campanha
            </Link>
          </div>
        </div>

        <DiceRoller campaignId={campaignId} initialRolls={initialRolls} />

        <LogoutButton />
      </aside>

      <ChatPanel
        campaignId={campaignId}
        initialMessages={initialMessages}
        onCharacterUpdate={setStats}
      />
    </div>
  );
}
