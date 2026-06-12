import { describe, expect, it } from "vitest";
import { GameMasterResponseError, parseGameMasterResponse } from "../responseParser";
import { validGameMasterResponse } from "./fixtures";

describe("parseGameMasterResponse", () => {
  it("parses a clean JSON response", () => {
    const result = parseGameMasterResponse(validGameMasterResponse());

    expect(result.narration).toContain("caminho iluminado");
    expect(result.summary).toContain("Pedraverde");
    expect(result.journalEntries).toEqual([
      { type: "EVENT", title: "Caminho iluminado", description: "Lyra encontrou um caminho iluminado na névoa." },
    ]);
    expect(result.characterStateChange).toEqual({ hpDelta: -2, goldDelta: 5 });
  });

  it("strips ```json fences", () => {
    const fenced = "```json\n" + validGameMasterResponse() + "\n```";
    const result = parseGameMasterResponse(fenced);
    expect(result.narration).toContain("caminho iluminado");
  });

  it("strips plain ``` fences", () => {
    const fenced = "```\n" + validGameMasterResponse() + "\n```";
    const result = parseGameMasterResponse(fenced);
    expect(result.summary).toContain("Pedraverde");
  });

  it("extracts the JSON object from surrounding prose", () => {
    const withProse = `Aqui está a resposta:\n${validGameMasterResponse()}\nFim.`;
    const result = parseGameMasterResponse(withProse);
    expect(result.narration).toContain("caminho iluminado");
  });

  it("defaults journalEntries to an empty array when absent", () => {
    const result = parseGameMasterResponse(
      validGameMasterResponse({ journalEntries: undefined, characterStateChange: undefined })
    );
    expect(result.journalEntries).toEqual([]);
    expect(result.characterStateChange).toBeUndefined();
  });

  it("drops journal entries with an invalid type or missing fields", () => {
    const result = parseGameMasterResponse(
      validGameMasterResponse({
        journalEntries: [
          { type: "EVENT", title: "Válido", description: "Entrada válida." },
          { type: "INVALID_TYPE", title: "Inválido", description: "Tipo desconhecido." },
          { type: "QUEST", title: "Sem descrição" },
        ],
      })
    );
    expect(result.journalEntries).toEqual([{ type: "EVENT", title: "Válido", description: "Entrada válida." }]);
  });

  it("ignores non-numeric characterStateChange fields", () => {
    const result = parseGameMasterResponse(
      validGameMasterResponse({ characterStateChange: { hpDelta: "lots", goldDelta: 10 } })
    );
    expect(result.characterStateChange).toEqual({ goldDelta: 10 });
  });

  it("throws GameMasterResponseError when narration is missing", () => {
    expect(() => parseGameMasterResponse(validGameMasterResponse({ narration: undefined }))).toThrow(
      GameMasterResponseError
    );
  });

  it("throws GameMasterResponseError when summary is missing", () => {
    expect(() => parseGameMasterResponse(validGameMasterResponse({ summary: undefined }))).toThrow(
      GameMasterResponseError
    );
  });

  it("throws GameMasterResponseError for invalid JSON", () => {
    expect(() => parseGameMasterResponse("isto não é json")).toThrow(GameMasterResponseError);
  });
});
