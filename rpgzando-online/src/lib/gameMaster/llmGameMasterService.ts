import { buildIntroductionPrompt, buildTurnPrompt } from "./contextBuilder";
import { MockGameMasterService } from "./mockGameMasterService";
import type { AIProvider } from "./providers/types";
import { parseGameMasterResponse } from "./responseParser";
import { GAME_MASTER_SYSTEM_PROMPT } from "./systemPrompt";
import type {
  GameMasterCharacterSnapshot,
  GameMasterIntroductionResult,
  GameMasterService,
  GameMasterTurnInput,
  GameMasterTurnResult,
} from "./types";

/**
 * {@link GameMasterService} backed by a real LLM provider.
 *
 * Sends the centralized system prompt plus the full context assembled by
 * `contextBuilder.ts`, and parses the model's JSON reply via `responseParser.ts`. If
 * the provider call fails or returns something that can't be parsed, falls back to
 * `MockGameMasterService` so the player always gets a reply.
 */
export class LLMGameMasterService implements GameMasterService {
  constructor(
    private readonly provider: AIProvider,
    private readonly fallback: GameMasterService = new MockGameMasterService()
  ) {}

  async introduceCampaign(
    character: GameMasterCharacterSnapshot,
    campaignTitle: string
  ): Promise<GameMasterIntroductionResult> {
    try {
      const prompt = buildIntroductionPrompt(character, campaignTitle);
      const raw = await this.provider.generateText(GAME_MASTER_SYSTEM_PROMPT, prompt);
      const parsed = parseGameMasterResponse(raw);

      return {
        narration: parsed.narration,
        journalEntries: parsed.journalEntries,
        summary: parsed.summary,
      };
    } catch (error) {
      logFallback(this.provider.name, "introduceCampaign", error);
      return this.fallback.introduceCampaign(character, campaignTitle);
    }
  }

  async takeTurn(input: GameMasterTurnInput): Promise<GameMasterTurnResult> {
    try {
      const prompt = buildTurnPrompt(input);
      const raw = await this.provider.generateText(GAME_MASTER_SYSTEM_PROMPT, prompt);
      return parseGameMasterResponse(raw);
    } catch (error) {
      logFallback(this.provider.name, "takeTurn", error);
      return this.fallback.takeTurn(input);
    }
  }
}

function logFallback(providerName: string, operation: string, error: unknown): void {
  console.error(
    `[gameMaster] Provedor "${providerName}" falhou em ${operation}, usando o Mestre de fallback:`,
    error
  );
}
