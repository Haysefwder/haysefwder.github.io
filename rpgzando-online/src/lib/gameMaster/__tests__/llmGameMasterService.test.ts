import { describe, expect, it } from "vitest";
import { LLMGameMasterService } from "../llmGameMasterService";
import type { AIProvider } from "../providers/types";
import { GAME_MASTER_SYSTEM_PROMPT } from "../systemPrompt";
import { makeCharacter, makeTurnInput, validGameMasterResponse } from "./fixtures";

class FakeProvider implements AIProvider {
  readonly name = "fake";
  calls: { systemPrompt: string; userPrompt: string }[] = [];

  constructor(private readonly respond: () => string) {}

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    this.calls.push({ systemPrompt, userPrompt });
    return this.respond();
  }
}

class ThrowingProvider implements AIProvider {
  readonly name = "throwing";

  async generateText(): Promise<string> {
    throw new Error("provider unavailable");
  }
}

describe("LLMGameMasterService.introduceCampaign", () => {
  it("uses the centralized system prompt and the assembled context", async () => {
    const provider = new FakeProvider(() => validGameMasterResponse());
    const service = new LLMGameMasterService(provider);

    const result = await service.introduceCampaign(makeCharacter(), "A Sombra de Pedraverde");

    expect(provider.calls).toHaveLength(1);
    expect(provider.calls[0].systemPrompt).toBe(GAME_MASTER_SYSTEM_PROMPT);
    expect(provider.calls[0].userPrompt).toContain("A Sombra de Pedraverde");
    expect(provider.calls[0].userPrompt).toContain("Lyra Stormwind");

    expect(result.narration).toContain("caminho iluminado");
    expect(result.summary).toContain("Pedraverde");
    expect(result.journalEntries).toHaveLength(1);
  });

  it("falls back to the mock GM when the response can't be parsed", async () => {
    const provider = new FakeProvider(() => "isto não é JSON");
    const service = new LLMGameMasterService(provider);

    const result = await service.introduceCampaign(makeCharacter(), "A Sombra de Pedraverde");

    expect(result.narration).toContain("Bem-vindo");
    expect(result.journalEntries.length).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("falls back to the mock GM when the provider throws", async () => {
    const service = new LLMGameMasterService(new ThrowingProvider());

    const result = await service.introduceCampaign(makeCharacter(), "A Sombra de Pedraverde");

    expect(result.narration).toContain("Bem-vindo");
  });
});

describe("LLMGameMasterService.takeTurn", () => {
  it("sends the full context (character, history, journal, dice rolls, summary) to the provider", async () => {
    const provider = new FakeProvider(() => validGameMasterResponse());
    const service = new LLMGameMasterService(provider);
    const input = makeTurnInput();

    await service.takeTurn(input);

    const { userPrompt } = provider.calls[0];
    expect(userPrompt).toContain(input.campaignSummary); // long-term memory carried forward
    expect(userPrompt).toContain("Luzes na Torre Caída"); // journal: active quest
    expect(userPrompt).toContain("Eu vou até a taverna."); // recent message history
    expect(userPrompt).toContain("1d20 + 3 -> [15] = 18"); // recent dice rolls
    expect(userPrompt).toContain("Eu ataco o monstro com minha espada!"); // player message
  });

  it("returns the parsed narration, updated summary, journal entries and state change", async () => {
    const provider = new FakeProvider(() => validGameMasterResponse());
    const service = new LLMGameMasterService(provider);

    const result = await service.takeTurn(makeTurnInput());

    expect(result.narration).toContain("caminho iluminado");
    expect(result.summary).toBe("Lyra está explorando um caminho iluminado perto de Pedraverde.");
    expect(result.journalEntries).toEqual([
      { type: "EVENT", title: "Caminho iluminado", description: "Lyra encontrou um caminho iluminado na névoa." },
    ]);
    expect(result.characterStateChange).toEqual({ hpDelta: -2, goldDelta: 5 });
  });

  it("falls back to the mock GM when the provider fails", async () => {
    const service = new LLMGameMasterService(new ThrowingProvider());

    // The fixture's player message ("Eu ataco o monstro...") + a fresh d20+3=18 roll
    // should be handled by the mock GM's combat handler (success on total >= 12).
    const result = await service.takeTurn(makeTurnInput());

    expect(result.narration.length).toBeGreaterThan(0);
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.journalEntries[0]?.title).toBe("Vitória em combate");
    expect(result.characterStateChange?.goldDelta).toBeGreaterThan(0);
  });
});
