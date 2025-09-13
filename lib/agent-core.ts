import type { AgentConfig, ProcessedContent } from "./types"
import { PromptGenerator } from "./prompt-generator"
import { AIClient } from "./ai-client"
import { OutputFormatter } from "./output-formatter"

export class AgentCore {
  private aiClient: AIClient

  constructor() {
    this.aiClient = new AIClient()
  }

  async processContent(config: AgentConfig, collectedData: ProcessedContent[]): Promise<string> {
    try {
      console.log(`[v0] Processing ${collectedData.length} content items`)

      // Combine and prioritize collected data
      const combinedData = this.combineAndPrioritizeData(collectedData, config)

      // Generate the main prompt
      const prompt = PromptGenerator.buildPrompt(config, combinedData)
      console.log(`[v0] Generated prompt (${prompt.length} chars)`)

      // Get AI response
      const aiResponse = await this.aiClient.generateResponse(prompt)
      console.log(`[v0] Received AI response (${aiResponse.length} chars)`)

      // Format according to output requirements
      const formattedPrompt = PromptGenerator.formatOutputPrompt(config, aiResponse)
      const finalResponse = await this.aiClient.generateResponse(formattedPrompt)

      // Validate and format output
      const validatedOutput = await OutputFormatter.validateAndFormat(finalResponse, config.outputFormat)
      console.log(`[v0] Final output validated for format: ${config.outputFormat}`)

      return validatedOutput
    } catch (error: any) {
      console.log(`[v0] Error in processContent:`, error.message)

      // Fallback to plain text if format validation fails
      if (error.message.includes("Format validation failed")) {
        return `Error processing content: ${error.message}\n\nFalling back to basic processing...`
      }

      throw error
    }
  }

  async generateContent(config: AgentConfig): Promise<string> {
    try {
      console.log(`[v0] Generating content for agent with config:`, config.role.primaryRole)

      // For now, return a simple generated message
      // In a full implementation, this would collect data and process it
      const timestamp = new Date().toISOString()
      const content = `AI Agent Report - ${timestamp}

Role: ${config.role.primaryRole}
Focus: ${config.role.focusTopic}
Target Audience: ${config.role.targetAudience}

This is a generated report from the COASAGENT system. The agent is running every 42 seconds and collecting data based on the configured parameters.

Location: ${config.location.googleMapsPin} (${config.location.radiusKm}km radius)
Data Sources: ${Object.entries(config.dataSources)
        .filter(([_, enabled]) => enabled)
        .map(([source]) => source)
        .join(", ")}

Status: Active and monitoring for relevant information.`

      return content
    } catch (error: any) {
      console.error(`[v0] Error in generateContent:`, error.message)
      return `Error generating content: ${error.message}`
    }
  }

  private combineAndPrioritizeData(data: ProcessedContent[], config: AgentConfig): string {
    // Sort by overall relevance score
    const sortedData = data.sort((a, b) => b.relevanceScores.overall - a.relevanceScores.overall)

    // Take top 10 most relevant items to avoid overwhelming the AI
    const topData = sortedData.slice(0, 10)

    // Combine into a single text block
    const combinedText = topData
      .map((item) => {
        const sourceInfo = `Source: ${item.source} (${item.timestamp.toISOString()})`
        const relevanceInfo = `Relevance: Geographic=${item.relevanceScores.geographic.toFixed(2)}, Topic=${item.relevanceScores.topic.toFixed(2)}`
        const content = item.processedContent || item.rawContent

        return `${sourceInfo}\n${relevanceInfo}\n${content}\n---`
      })
      .join("\n\n")

    console.log(`[v0] Combined ${topData.length} items into ${combinedText.length} chars`)
    return combinedText
  }

  getAIClientStatus() {
    return {
      currentModel: this.aiClient.getCurrentModel(),
      modelStatus: this.aiClient.getModelStatus(),
    }
  }

  getCurrentModel(): string {
    return this.aiClient.getCurrentModel()
  }
}
