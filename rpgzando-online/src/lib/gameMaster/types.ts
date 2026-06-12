import type { JournalEntryType, MessageSender } from "@prisma/client";

/** The six D&D 5e ability scores. */
export interface GameMasterAttributes {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

/** A single item carried by the character. */
export interface GameMasterInventoryItem {
  name: string;
  quantity: number;
  description?: string | null;
}

/** Read-only snapshot of the character the Game Master narrates for. */
export interface GameMasterCharacterSnapshot {
  name: string;
  race: string;
  class: string;
  level: number;
  hpCurrent: number;
  hpMax: number;
  gold: number;
  attributes: GameMasterAttributes;
  inventory: GameMasterInventoryItem[];
}

/** A previous line of dialogue, used to give the Game Master short-term context. */
export interface GameMasterMessage {
  sender: MessageSender;
  content: string;
}

/** Information about a dice roll, used to give the Game Master extra context. */
export interface GameMasterDiceContext {
  description: string;
  total: number;
}

/** A journal entry summarized for the Game Master's context window. */
export interface GameMasterJournalEntrySnapshot {
  title: string;
  description: string;
}

/** Campaign journal context: quests, events and decisions the Game Master should remember. */
export interface GameMasterJournalContext {
  activeQuests: GameMasterJournalEntrySnapshot[];
  completedQuests: GameMasterJournalEntrySnapshot[];
  recentEvents: GameMasterJournalEntrySnapshot[];
  recentDecisions: GameMasterJournalEntrySnapshot[];
}

export interface GameMasterTurnInput {
  character: GameMasterCharacterSnapshot;
  campaignTitle: string;
  /** Rolling summary of the story so far, used to keep continuity between sessions. */
  campaignSummary: string;
  recentMessages: GameMasterMessage[];
  /** Journal context: active/completed quests and recent events/decisions. */
  journal: GameMasterJournalContext;
  /** Most recent dice rolls (oldest first), used for extra narrative context. */
  recentDiceRolls: GameMasterDiceContext[];
  playerMessage: string;
  /** The dice roll made right before this message, if any (used to resolve actions). */
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
 * The MVP ships a deterministic mock implementation, and a real implementation backed
 * by an LLM (Gemini, OpenAI or Anthropic Claude) is selected via the `AI_PROVIDER` env
 * var. The interface is shaped so any implementation can be swapped without any
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
