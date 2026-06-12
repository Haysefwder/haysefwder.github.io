"use client";

import { useState, useTransition } from "react";
import type { DiceType } from "@prisma/client";
import {
  DICE_TYPES,
  DICE_SIDES,
  MAX_DICE_QUANTITY,
  MAX_DICE_MODIFIER,
  formatRollOutcome,
} from "@/lib/dice";
import { rollDiceAction, type DiceRollView } from "@/lib/actions/campaigns";

interface DiceRollerProps {
  campaignId: string;
  initialRolls: DiceRollView[];
}

export default function DiceRoller({ campaignId, initialRolls }: DiceRollerProps) {
  const [diceType, setDiceType] = useState<DiceType>("D20");
  const [quantity, setQuantity] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [rolls, setRolls] = useState<DiceRollView[]>(initialRolls);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRoll() {
    setError(null);

    startTransition(async () => {
      const result = await rollDiceAction(campaignId, diceType, quantity, modifier);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.roll) {
        setRolls((prev) => [result.roll!, ...prev].slice(0, 10));
      }
    });
  }

  return (
    <div className="rounded-lg border border-stone-800 bg-stone-900/40 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-amber-400">Dados</h2>

      <div className="mb-3 flex flex-wrap gap-2">
        {DICE_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setDiceType(type)}
            className={`rounded border px-3 py-1.5 text-sm transition-colors ${
              diceType === type
                ? "border-amber-500 bg-amber-600 text-stone-950"
                : "border-stone-700 text-stone-200 hover:border-amber-500"
            }`}
          >
            d{DICE_SIDES[type]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          Qtd.
          <input
            type="number"
            min={1}
            max={MAX_DICE_QUANTITY}
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="w-16 rounded border border-stone-700 bg-stone-900 px-2 py-1 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2">
          Mod.
          <input
            type="number"
            min={-MAX_DICE_MODIFIER}
            max={MAX_DICE_MODIFIER}
            value={modifier}
            onChange={(event) => setModifier(Number(event.target.value))}
            className="w-16 rounded border border-stone-700 bg-stone-900 px-2 py-1 text-stone-100 focus:border-amber-500 focus:outline-none"
          />
        </label>
        <button
          type="button"
          onClick={handleRoll}
          disabled={isPending}
          className="ml-auto rounded bg-amber-600 px-4 py-1.5 font-medium text-stone-950 hover:bg-amber-500 disabled:opacity-60"
        >
          {isPending ? "Rolando..." : "Rolar"}
        </button>
      </div>

      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}

      <ul className="space-y-1 text-sm text-stone-300">
        {rolls.length === 0 && <li className="text-stone-500">Nenhuma rolagem ainda.</li>}
        {rolls.map((roll) => (
          <li
            key={roll.id}
            className="flex justify-between border-b border-stone-800 pb-1 last:border-0"
          >
            <span>{formatRollOutcome(roll)}</span>
            <span className="text-stone-500">
              {new Date(roll.createdAt).toLocaleTimeString("pt-BR")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
