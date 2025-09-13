import { type NextRequest, NextResponse } from "next/server"
import { instanceManager } from "@/lib/instance-manager"
import type { AgentConfig } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const config: AgentConfig = await request.json()

    // Validate required fields
    if (!config.role.focusTopic || !config.role.searchPurpose) {
      return NextResponse.json({ error: "Focus topic and search purpose are required" }, { status: 400 })
    }

    // Create and start instance
    const instanceId = instanceManager.createInstance(config)
    const started = instanceManager.startInstance(instanceId)

    if (!started) {
      return NextResponse.json({ error: "Failed to start agent instance" }, { status: 500 })
    }

    const instance = instanceManager.getInstance(instanceId)

    return NextResponse.json({
      success: true,
      instanceId,
      status: instance?.status,
      message: "Agent started successfully. It will run every 42 seconds.",
      rssUrl: `/api/rss/${config.outputFormat}`,
    })
  } catch (error: any) {
    console.error("[v0] Error starting agent:", error)
    return NextResponse.json(
      {
        error: "Failed to start agent",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
