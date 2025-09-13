import { GoogleGenerativeAI } from "@google/generative-ai"

export class GeminiClient {
  private client: GoogleGenerativeAI
  private model: string

  constructor(apiKey: string, model = "gemini-2.0-flash-exp") {
    this.client = new GoogleGenerativeAI(apiKey)
    this.model = model
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model })
      const result = await model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error("[v0] Gemini API error:", error)
      throw new Error(`Gemini API failed: ${error}`)
    }
  }

  async generateContentStream(prompt: string): Promise<AsyncGenerator<string, void, unknown>> {
    const model = this.client.getGenerativeModel({ model: this.model })
    const result = await model.generateContentStream(prompt)

    async function* streamGenerator() {
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          yield chunkText
        }
      }
    }

    return streamGenerator()
  }
}
