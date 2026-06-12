import { MockGameMasterService } from "./mockGameMasterService";
import type { GameMasterService } from "./types";

/**
 * Active Game Master implementation used by the API routes.
 *
 * Swap this for a real AI-backed implementation (OpenAI, Gemini, Claude, ...) once
 * one is ready -- it only needs to satisfy `GameMasterService`.
 */
export const gameMasterService: GameMasterService = new MockGameMasterService();

export * from "./types";
