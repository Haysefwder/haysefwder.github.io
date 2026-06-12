import OpenAI from "openai";
import { AIProviderError, type AIProvider } from "./types";

const DEFAULT_MODEL = "gpt-4o-mini";

/** OpenAI-backed implementation of {@link AIProvider}. */
export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new OpenAI({ apiKey });
    this.model = model || DEFAULT_MODEL;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const text = response.choices[0]?.message?.content;
      if (!text) {
        throw new Error("Resposta vazia da OpenAI.");
      }
      return text;
    } catch (error) {
      throw new AIProviderError(this.name, error);
    }
  }
}
