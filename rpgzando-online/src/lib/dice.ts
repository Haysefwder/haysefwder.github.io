import { DiceType } from "@prisma/client";

export const DICE_SIDES: Record<DiceType, number> = {
  D4: 4,
  D6: 6,
  D8: 8,
  D10: 10,
  D12: 12,
  D20: 20,
  D100: 100,
};

export const DICE_TYPES: DiceType[] = ["D4", "D6", "D8", "D10", "D12", "D20", "D100"];

export const MAX_DICE_QUANTITY = 20;
export const MAX_DICE_MODIFIER = 50;

export interface RollOutcome {
  diceType: DiceType;
  quantity: number;
  modifier: number;
  results: number[];
  total: number;
}

export function isDiceType(value: unknown): value is DiceType {
  return typeof value === "string" && (DICE_TYPES as string[]).includes(value);
}

/** Rolls `quantity` dice of `diceType` and sums them plus `modifier`. */
export function rollDice(diceType: DiceType, quantity: number, modifier: number): RollOutcome {
  const sides = DICE_SIDES[diceType];
  const results = Array.from(
    { length: quantity },
    () => Math.floor(Math.random() * sides) + 1
  );
  const total = results.reduce((sum, value) => sum + value, 0) + modifier;

  return { diceType, quantity, modifier, results, total };
}

/** Formats a roll outcome for display in the chat/journal, e.g. "1d20 + 2 -> [15] = 17". */
export function formatRollOutcome(outcome: RollOutcome): string {
  const sides = DICE_SIDES[outcome.diceType];
  const dicePart = `${outcome.quantity}d${sides}`;
  const modifierPart =
    outcome.modifier === 0
      ? ""
      : outcome.modifier > 0
        ? ` + ${outcome.modifier}`
        : ` - ${Math.abs(outcome.modifier)}`;
  const rolls = outcome.results.join(", ");

  return `${dicePart}${modifierPart} -> [${rolls}] = ${outcome.total}`;
}
