/**
 * Provider-agnostic abstraction over "an LLM that can follow a system prompt and
 * respond to a user prompt with text". Each supported AI (Gemini, OpenAI, Claude)
 * implements this interface so the rest of the Game Master code never depends on a
 * specific vendor SDK.
 */
export interface AIProvider {
  /** Short identifier used in logs and error messages, e.g. "gemini". */
  readonly name: string;

  /** Sends the system + user prompt to the model and returns its raw text reply. */
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

/** Wraps any error raised by a provider SDK so callers can detect provider failures. */
export class AIProviderError extends Error {
  constructor(providerName: string, cause: unknown) {
    super(
      `AI provider "${providerName}" failed: ${cause instanceof Error ? cause.message : String(cause)}`
    );
    this.name = "AIProviderError";
    this.cause = cause;
  }
}
