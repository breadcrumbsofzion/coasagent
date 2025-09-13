import { type NextRequest, NextResponse } from "next/server"
import { instanceManager } from "@/lib/instance-manager"

export async function POST(request: NextRequest) {
  try {
    const { instanceId } = await request.json()

    if (!instanceId) {
      return NextResponse.json({ error: "Instance ID is required" }, { status: 400 })
    }

    const stopped = instanceManager.stopInstance(instanceId)

    if (!stopped) {
      return NextResponse.json({ error: "Instance not found or already stopped" }, { status: 404 })
    }

    const instance = instanceManager.getInstance(instanceId)

    return NextResponse.json({
      success: true,
      instanceId,
      status: instance?.status,
      message: "Agent stopped successfully",
    })
  } catch (error: any) {
    console.error("[v0] Error stopping agent:", error)
    return NextResponse.json(
      {
        error: "Failed to stop agent",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
