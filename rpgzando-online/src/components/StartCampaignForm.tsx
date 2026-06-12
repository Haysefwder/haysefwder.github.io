"use client";

import { useActionState } from "react";
import { startCampaignAction, type CampaignFormState } from "@/lib/actions/campaigns";

const initialState: CampaignFormState = {};

export default function StartCampaignForm({
  characterId,
  characterName,
}: {
  characterId: string;
  characterName: string;
}) {
  const boundAction = startCampaignAction.bind(null, characterId);
  const [state, formAction, isPending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-stone-300">Nome da campanha (opcional)</span>
        <input
          name="title"
          type="text"
          placeholder={`A Jornada de ${characterName}`}
          className="rounded border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100 focus:border-amber-500 focus:outline-none"
        />
      </label>

      {state?.error && (
        <p className="rounded border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded bg-amber-600 px-4 py-2 font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-60"
      >
        {isPending ? "Iniciando..." : "Iniciar campanha"}
      </button>
    </form>
  );
}
