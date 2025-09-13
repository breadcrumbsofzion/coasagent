import { GeminiClient } from "./gemini-client"

export class AIClient {
  private geminiClient: GeminiClient | null = null
  private models = ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"]
  private currentModelIndex = 0
  private rateLimitCooldown: Record<string, number> = {}

  constructor() {
    const geminiApiKey = process.env.GEMINI_API_KEY
    if (geminiApiKey) {
      this.geminiClient = new GeminiClient(geminiApiKey)
      console.log("[v0] Gemini API client initialized")
    } else {
      console.log("[v0] No Gemini API key found, using mock responses")
    }
  }

  async generateResponse(prompt: string, maxRetries = 3): Promise<string> {
    let attempts = 0

    while (attempts < maxRetries) {
      const model = this.models[this.currentModelIndex]

      // Check if model is in cooldown
      if (this.rateLimitCooldown[model] && Date.now() < this.rateLimitCooldown[model]) {
        this.downgradeModel()
        attempts++
        continue
      }

      try {
        console.log(`[v0] Attempting API call with model: ${model}`)

        const response = this.geminiClient
          ? await this.geminiClient.generateContent(prompt)
          : await this.makeAPICall(model, prompt)

        // Success - try to upgrade if possible
        this.upgradeModelIfPossible()
        return response
      } catch (error: any) {
        console.log(`[v0] API call failed with ${model}:`, error.message)

        if (error.message.includes("rate_limit") || error.message.includes("quota")) {
          // Set cooldown for 5 minutes
          this.rateLimitCooldown[model] = Date.now() + 5 * 60 * 1000
          console.log(`[v0] Rate limit hit for ${model}, setting 5min cooldown`)
        }

        this.downgradeModel()
        attempts++
      }
    }

    throw new Error("All models exhausted after maximum retries")
  }

  private async makeAPICall(model: string, prompt: string): Promise<string> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate occasional rate limiting
    if (Math.random() < 0.3) {
      throw new Error("rate_limit: Too many requests")
    }

    // Simulate occasional other errors
    if (Math.random() < 0.1) {
      throw new Error("api_error: Service temporarily unavailable")
    }

    // Return mock response
    return `Mock AI response for model ${model}:\n\nProcessed prompt: ${prompt.substring(0, 100)}...\n\nThis is a simulated response that would come from the actual AI model. In production, this would integrate with the real Gemini API.`
  }

  private downgradeModel(): void {
    if (this.currentModelIndex < this.models.length - 1) {
      this.currentModelIndex++
      console.log(`[v0] Downgraded to model: ${this.models[this.currentModelIndex]}`)
    }
  }

  private upgradeModelIfPossible(): void {
    if (this.currentModelIndex > 0 && this.noRecentRateLimits()) {
      this.currentModelIndex--
      console.log(`[v0] Upgraded to model: ${this.models[this.currentModelIndex]}`)
    }
  }

  private noRecentRateLimits(): boolean {
    const now = Date.now()
    return !Object.values(this.rateLimitCooldown).some((cooldownTime) => now < cooldownTime)
  }

  getCurrentModel(): string {
    return this.models[this.currentModelIndex]
  }

  getModelStatus(): Record<string, "available" | "cooldown"> {
    const now = Date.now()
    const status: Record<string, "available" | "cooldown"> = {}

    this.models.forEach((model) => {
      status[model] = this.rateLimitCooldown[model] && now < this.rateLimitCooldown[model] ? "cooldown" : "available"
    })

    return status
  }
}
