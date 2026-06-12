import { AnthropicProvider } from "./anthropicProvider";
import { GeminiProvider } from "./geminiProvider";
import { OpenAIProvider } from "./openaiProvider";
import type { AIProvider } from "./types";

export * from "./types";

/**
 * Builds the {@link AIProvider} selected via the `AI_PROVIDER` env var
 * ("gemini" | "openai" | "anthropic").
 *
 * Returns `null` when no provider is configured or its API key is missing, so the
 * caller can fall back to the deterministic mock Game Master.
 */
export function createAIProvider(): AIProvider | null {
  const providerName = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();

  switch (providerName) {
    case "gemini": {
      const apiKey = process.env.GEMINI_API_KEY;
      return apiKey ? new GeminiProvider(apiKey, process.env.GEMINI_MODEL) : null;
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      return apiKey ? new OpenAIProvider(apiKey, process.env.OPENAI_MODEL) : null;
    }
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      return apiKey ? new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL) : null;
    }
    default:
      return null;
  }
}
