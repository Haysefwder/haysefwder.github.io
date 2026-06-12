import type { JournalEntryType, MessageSender } from "@prisma/client";

/** Read-only snapshot of the character the Game Master narrates for. */
export interface GameMasterCharacterSnapshot {
  name: string;
  race: string;
  class: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  gold: number;
}

/** A previous line of dialogue, used to give the Game Master short-term context. */
export interface GameMasterMessage {
  sender: MessageSender;
  content: string;
}

/** Information about the most recent dice roll the player made, if any. */
export interface GameMasterDiceContext {
  description: string;
  total: number;
}

export interface GameMasterTurnInput {
  character: GameMasterCharacterSnapshot;
  campaignTitle: string;
  /** Rolling summary of the story so far, used to keep continuity between sessions. */
  campaignSummary: string;
  recentMessages: GameMasterMessage[];
  playerMessage: string;
  lastDiceRoll?: GameMasterDiceContext | null;
}

/** A journal entry the Game Master wants recorded as a consequence of this turn. */
export interface JournalEntryDraft {
  type: JournalEntryType;
  title: string;
  description: string;
}

/** Permanent changes to the character caused by this turn of the story. */
export interface CharacterStateChange {
  hpDelta?: number;
  goldDelta?: number;
}

export interface GameMasterIntroductionResult {
  narration: string;
  journalEntries: JournalEntryDraft[];
  summary: string;
}

export interface GameMasterTurnResult {
  narration: string;
  journalEntries: JournalEntryDraft[];
  /** Updated rolling summary of the campaign, persisted for future turns/sessions. */
  summary: string;
  characterStateChange?: CharacterStateChange;
}

/**
 * Abstraction over "whoever narrates the campaign".
 *
 * The MVP ships a deterministic mock implementation. The interface is shaped so a
 * future implementation can call an LLM (OpenAI, Gemini, Claude, ...) without any
 * changes to the API routes or UI that consume this service.
 */
export interface GameMasterService {
  /** Generates the opening narration when a brand-new campaign is created. */
  introduceCampaign(
    character: GameMasterCharacterSnapshot,
    campaignTitle: string
  ): Promise<GameMasterIntroductionResult>;

  /** Generates the Game Master's reply to the player's latest message. */
  takeTurn(input: GameMasterTurnInput): Promise<GameMasterTurnResult>;
}
