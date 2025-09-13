import { NextResponse } from "next/server"
import { instanceManager } from "@/lib/instance-manager"

export async function GET() {
  try {
    const instances = instanceManager.getAllInstances()
    const stats = instanceManager.getStats()

    return NextResponse.json({
      instances: instances.map((instance) => ({
        id: instance.id,
        status: instance.status,
        lastUpdate: instance.lastUpdate,
        config: {
          focusTopic: instance.config.role.focusTopic,
          outputFormat: instance.config.outputFormat,
          location: instance.config.location.googleMapsPin,
        },
      })),
      stats,
    })
  } catch (error: any) {
    console.error("[v0] Error getting agent status:", error)
    return NextResponse.json(
      {
        error: "Failed to get agent status",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
