import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createAIProvider } from "../providers";
import { AnthropicProvider } from "../providers/anthropicProvider";
import { GeminiProvider } from "../providers/geminiProvider";
import { OpenAIProvider } from "../providers/openaiProvider";

const ENV_KEYS = [
  "AI_PROVIDER",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_MODEL",
  "OPENAI_MODEL",
  "ANTHROPIC_MODEL",
] as const;

let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>;

beforeEach(() => {
  savedEnv = {};
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

describe("createAIProvider", () => {
  it("returns null when AI_PROVIDER is unset (falls back to the mock GM)", () => {
    expect(createAIProvider()).toBeNull();
  });

  it("returns null for an unknown AI_PROVIDER", () => {
    process.env.AI_PROVIDER = "skynet";
    process.env.OPENAI_API_KEY = "sk-test";
    expect(createAIProvider()).toBeNull();
  });

  it("returns null when the matching API key is missing", () => {
    process.env.AI_PROVIDER = "gemini";
    expect(createAIProvider()).toBeNull();
  });

  it("selects GeminiProvider for AI_PROVIDER=gemini", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key";
    expect(createAIProvider()).toBeInstanceOf(GeminiProvider);
  });

  it("selects OpenAIProvider for AI_PROVIDER=openai", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "test-key";
    expect(createAIProvider()).toBeInstanceOf(OpenAIProvider);
  });

  it("selects AnthropicProvider for AI_PROVIDER=anthropic", () => {
    process.env.AI_PROVIDER = "anthropic";
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(createAIProvider()).toBeInstanceOf(AnthropicProvider);
  });

  it("is case-insensitive and trims whitespace", () => {
    process.env.AI_PROVIDER = "  GEMINI  ";
    process.env.GEMINI_API_KEY = "test-key";
    expect(createAIProvider()).toBeInstanceOf(GeminiProvider);
  });
});
