import { NextResponse } from "next/server"
import { instanceManager } from "@/lib/instance-manager"
import type { AgentConfig } from "@/lib/types"

export async function POST() {
  try {
    // Default configuration for auto-start
    const defaultConfig: AgentConfig = {
      location: {
        googleMapsPin: "37.7749, -122.4194", // San Francisco
        radiusKm: 420,
      },
      role: {
        primaryRole: "AI Research Analyst and Technology Consultant",
        focusTopic: "Artificial Intelligence trends and applications in business",
        targetAudience: "Technology professionals and business decision makers",
        searchPurpose: "To identify emerging AI technologies and their practical business applications",
        dataPresentation: "Structured insights with actionable recommendations and data points",
      },
      personalitySliders: {
        socialMood: 0,
        politicalBearing: 0,
        techSavviness: 3,
        presentationStyle: 2,
        contentDensity: 1,
      },
      contextOverride: "",
      outputFormat: "normal",
      dataSources: {
        llm: true,
        internet: true,
        reddit: true,
        facebook: false,
        twitter: true,
        youtube: true,
        instagram: false,
      },
      modifiers: {
        hardFacts: false,
        meaningFocus: true,
        suggestiveMode: false,
        strictGuidance: false,
        laymanFriendly: true,
        adultLanguage: false,
        includeToolbox: true,
        includeTips: true,
      },
    }

    // Check if there's already a running instance
    const runningInstances = instanceManager.getRunningInstances()
    if (runningInstances.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Agent already running",
        instanceId: runningInstances[0].id,
        status: "running",
      })
    }

    // Create and start default instance
    const instanceId = instanceManager.createInstance(defaultConfig)
    const started = instanceManager.startInstance(instanceId)

    if (!started) {
      return NextResponse.json({ error: "Failed to auto-start agent instance" }, { status: 500 })
    }

    console.log("[v0] Auto-started default agent instance:", instanceId)

    return NextResponse.json({
      success: true,
      instanceId,
      status: "running",
      message: "Default agent auto-started successfully. Running every 42 seconds.",
      rssUrl: `/api/rss/${defaultConfig.outputFormat}`,
    })
  } catch (error: any) {
    console.error("[v0] Error auto-starting agent:", error)
    return NextResponse.json(
      {
        error: "Failed to auto-start agent",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
