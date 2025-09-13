import { type NextRequest, NextResponse } from "next/server"
import { AgentCore } from "@/lib/agent-core"
import { DataCollectionPipeline } from "@/lib/data-collectors"
import { rssManager } from "../../rss/[format]/route"
import type { AgentConfig } from "@/lib/types"

const agentCore = new AgentCore()
const dataCollectionPipeline = new DataCollectionPipeline()

export async function POST(request: NextRequest) {
  try {
    const config: AgentConfig = await request.json()

    console.log(`[v0] Starting agent generation cycle`)
    console.log(`[v0] Config: Focus="${config.role.focusTopic}", Format="${config.outputFormat}"`)

    // Validate required fields
    if (!config.role.focusTopic || !config.role.searchPurpose) {
      return NextResponse.json({ error: "Focus topic and search purpose are required" }, { status: 400 })
    }

    // Collect data from all sources
    const collectedData = await dataCollectionPipeline.collectAll(config)

    if (collectedData.length === 0) {
      return NextResponse.json({ error: "No relevant data found" }, { status: 404 })
    }

    // Process with AI agent
    const processedContent = await agentCore.processContent(config, collectedData)

    // Generate source attribution
    const sources = [...new Set(collectedData.map((item) => item.source))]
    const sourceAttribution = `Generated from ${sources.length} sources: ${sources.slice(0, 3).join(", ")}${sources.length > 3 ? "..." : ""}`

    // Add to RSS feed
    rssManager.addItem(config.outputFormat, processedContent, config, sourceAttribution)

    // Get AI client status for debugging
    const aiStatus = agentCore.getAIClientStatus()

    return NextResponse.json({
      success: true,
      content: processedContent,
      sourceAttribution,
      stats: {
        dataItemsCollected: collectedData.length,
        topSources: sources.slice(0, 5),
        aiModel: aiStatus.currentModel,
        modelStatus: aiStatus.modelStatus,
      },
      rssUrl: `/api/rss/${config.outputFormat}`,
    })
  } catch (error: any) {
    console.error("[v0] Error in agent generation:", error)
    return NextResponse.json(
      {
        error: "Agent generation failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
