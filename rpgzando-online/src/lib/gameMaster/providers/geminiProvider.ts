import { GoogleGenAI } from "@google/genai";
import { AIProviderError, type AIProvider } from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash";

/** Google Gemini-backed implementation of {@link AIProvider}. */
export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  private readonly client: GoogleGenAI;
  private readonly model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model || DEFAULT_MODEL;
  }

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: userPrompt,
        config: { systemInstruction: systemPrompt },
      });

      const text = response.text;
      if (!text) {
        throw new Error("Resposta vazia do Gemini.");
      }
      return text;
    } catch (error) {
      throw new AIProviderError(this.name, error);
    }
  }
}
