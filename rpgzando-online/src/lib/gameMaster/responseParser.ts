import type { JournalEntryType } from "@prisma/client";
import type { CharacterStateChange, JournalEntryDraft } from "./types";

export interface ParsedGameMasterResponse {
  narration: string;
  journalEntries: JournalEntryDraft[];
  summary: string;
  characterStateChange?: CharacterStateChange;
}

/** Raised when the LLM response can't be parsed into the expected shape. */
export class GameMasterResponseError extends Error {}

const VALID_JOURNAL_TYPES: readonly JournalEntryType[] = ["EVENT", "DECISION", "QUEST"];

/**
 * Parses the raw text returned by an {@link AIProvider} into the structured shape
 * described by `systemPrompt.ts`. Tolerates markdown code fences and stray text
 * around the JSON object, since some models add them despite instructions not to.
 */
export function parseGameMasterResponse(raw: string): ParsedGameMasterResponse {
  const jsonText = extractJsonObject(raw);

  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new GameMasterResponseError("Resposta do modelo não é um JSON válido.");
  }

  if (typeof data !== "object" || data === null) {
    throw new GameMasterResponseError("Resposta do modelo não é um objeto JSON.");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.narration !== "string" || !obj.narration.trim()) {
    throw new GameMasterResponseError('Campo "narration" ausente ou inválido na resposta do modelo.');
  }

  if (typeof obj.summary !== "string" || !obj.summary.trim()) {
    throw new GameMasterResponseError('Campo "summary" ausente ou inválido na resposta do modelo.');
  }

  return {
    narration: obj.narration.trim(),
    journalEntries: parseJournalEntries(obj.journalEntries),
    summary: obj.summary.trim(),
    characterStateChange: parseCharacterStateChange(obj.characterStateChange),
  };
}

/** Strips ```json fences or surrounding prose, returning the outermost `{...}` block. */
function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function parseJournalEntries(value: unknown): JournalEntryDraft[] {
  if (!Array.isArray(value)) return [];

  const entries: JournalEntryDraft[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue;
    const entry = item as Record<string, unknown>;
    const { type, title, description } = entry;

    if (
      typeof type === "string" &&
      (VALID_JOURNAL_TYPES as readonly string[]).includes(type) &&
      typeof title === "string" &&
      title.trim() &&
      typeof description === "string" &&
      description.trim()
    ) {
      entries.push({
        type: type as JournalEntryType,
        title: title.trim(),
        description: description.trim(),
      });
    }
  }
  return entries;
}

function parseCharacterStateChange(value: unknown): CharacterStateChange | undefined {
  if (typeof value !== "object" || value === null) return undefined;

  const obj = value as Record<string, unknown>;
  const change: CharacterStateChange = {};

  if (typeof obj.hpDelta === "number" && Number.isFinite(obj.hpDelta)) {
    change.hpDelta = Math.trunc(obj.hpDelta);
  }
  if (typeof obj.goldDelta === "number" && Number.isFinite(obj.goldDelta)) {
    change.goldDelta = Math.trunc(obj.goldDelta);
  }

  return change.hpDelta !== undefined || change.goldDelta !== undefined ? change : undefined;
}
