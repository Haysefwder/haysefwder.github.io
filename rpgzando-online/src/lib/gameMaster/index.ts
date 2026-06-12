import { LLMGameMasterService } from "./llmGameMasterService";
import { MockGameMasterService } from "./mockGameMasterService";
import { createAIProvider } from "./providers";
import type { GameMasterService } from "./types";

/**
 * Selects the active Game Master implementation.
 *
 * If `AI_PROVIDER` (and the matching API key) is configured, a real LLM-backed
 * `LLMGameMasterService` is used — it falls back to `MockGameMasterService` on its
 * own if the provider call ever fails. Otherwise `MockGameMasterService` is used
 * directly. No other part of the app needs to know which implementation is active.
 */
const provider = createAIProvider();

export const gameMasterService: GameMasterService = provider
  ? new LLMGameMasterService(provider)
  : new MockGameMasterService();

export * from "./types";
