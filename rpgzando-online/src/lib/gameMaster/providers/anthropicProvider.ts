import Anthropic from "@anthropic-ai/sdk";
import { AIProviderError, type AIProvider } from "./types";

const DEFAULT_MODEL = "claude-sonnet-4-5";
const MAX_TOKENS = 2048;

/** Anthropic Claude-backed implementation of {@link AIProvider}. */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";

  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || DEFAULT_MODEL;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text" || !textBlock.text) {
        throw new Error("Resposta vazia da Anthropic.");
      }
      return textBlock.text;
    } catch (error) {
      throw new AIProviderError(this.name, error);
    }
  }
}
