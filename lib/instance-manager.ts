import type { AgentConfig, AgentInstance } from "./types"
import { AgentCore } from "./agent-core"
import { DataCollectionPipeline } from "./data-collectors"
import { rssManager } from "../app/api/rss/[format]/route"

export class InstanceManager {
  private instances: Map<string, AgentInstance> = new Map()
  private agentCore: AgentCore
  private dataCollectionPipeline: DataCollectionPipeline

  constructor() {
    this.agentCore = new AgentCore()
    this.dataCollectionPipeline = new DataCollectionPipeline()
  }

  createInstance(config: AgentConfig): string {
    const instanceId = this.generateInstanceId()

    const instance: AgentInstance = {
      id: instanceId,
      config: { ...config }, // Deep copy to avoid reference issues
      status: "stopped",
      lastUpdate: new Date(),
    }

    this.instances.set(instanceId, instance)
    console.log(`[v0] Created agent instance: ${instanceId}`)

    return instanceId
  }

  startInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      console.log(`[v0] Instance not found: ${instanceId}`)
      return false
    }

    if (instance.status === "running") {
      console.log(`[v0] Instance already running: ${instanceId}`)
      return true
    }

    try {
      // Create CRON job that runs every 4.2 minutes (252 seconds)
      const cronJob = setInterval(async () => {
        await this.executeAgentCycle(instanceId)
      }, 252000) // 4.2 minutes in milliseconds

      instance.cronJob = cronJob
      instance.status = "running"
      instance.lastUpdate = new Date()

      console.log(`[v0] Started agent instance: ${instanceId}`)

      // Run first cycle immediately
      setTimeout(() => this.executeAgentCycle(instanceId), 1000)

      return true
    } catch (error) {
      console.log(`[v0] Failed to start instance ${instanceId}:`, error)
      instance.status = "error"
      return false
    }
  }

  stopInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      console.log(`[v0] Instance not found: ${instanceId}`)
      return false
    }

    if (instance.cronJob) {
      clearInterval(instance.cronJob)
      instance.cronJob = undefined
    }

    instance.status = "stopped"
    instance.lastUpdate = new Date()

    console.log(`[v0] Stopped agent instance: ${instanceId}`)
    return true
  }

  deleteInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      return false
    }

    // Stop the instance first
    this.stopInstance(instanceId)

    // Remove from instances map
    this.instances.delete(instanceId)

    console.log(`[v0] Deleted agent instance: ${instanceId}`)
    return true
  }

  getInstance(instanceId: string): AgentInstance | null {
    return this.instances.get(instanceId) || null
  }

  getAllInstances(): AgentInstance[] {
    return Array.from(this.instances.values())
  }

  getRunningInstances(): AgentInstance[] {
    return this.getAllInstances().filter((instance) => instance.status === "running")
  }

  updateInstanceConfig(instanceId: string, newConfig: AgentConfig): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      return false
    }

    // Stop instance if running
    const wasRunning = instance.status === "running"
    if (wasRunning) {
      this.stopInstance(instanceId)
    }

    // Update configuration
    instance.config = { ...newConfig }
    instance.lastUpdate = new Date()

    // Restart if it was running
    if (wasRunning) {
      this.startInstance(instanceId)
    }

    console.log(`[v0] Updated config for instance: ${instanceId}`)
    return true
  }

  private async executeAgentCycle(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== "running") {
      return
    }

    try {
      console.log(`[v0] Executing agent cycle for instance: ${instanceId}`)
      console.log(`[v0] Config: Focus="${instance.config.role.focusTopic}", Format="${instance.config.outputFormat}"`)

      // Collect data
      const collectedData = await this.dataCollectionPipeline.collectAll(instance.config)

      if (collectedData.length === 0) {
        console.log(`[v0] No relevant data found for instance: ${instanceId}`)
        return
      }

      // Process with AI
      const processedContent = await this.agentCore.processContent(instance.config, collectedData)

      // Generate source attribution
      const sources = [...new Set(collectedData.map((item) => item.source))]
      const sourceAttribution = `Generated from ${sources.length} sources: ${sources.slice(0, 3).join(", ")}${sources.length > 3 ? "..." : ""}`

      // Add to RSS feed
      rssManager.addItem(instance.config.outputFormat, processedContent, instance.config, sourceAttribution)

      // Update instance
      instance.lastUpdate = new Date()

      console.log(`[v0] Successfully completed cycle for instance: ${instanceId}`)
      console.log(`[v0] Generated ${processedContent.length} chars for format: ${instance.config.outputFormat}`)
    } catch (error: any) {
      console.log(`[v0] Error in agent cycle for instance ${instanceId}:`, error.message)
      instance.status = "error"
      instance.lastUpdate = new Date()

      // Stop the instance to prevent repeated errors
      this.stopInstance(instanceId)
    }
  }

  private generateInstanceId(): string {
    return `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Cleanup method to remove old stopped instances
  cleanupOldInstances(maxAgeHours = 24): number {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)
    let removedCount = 0

    this.instances.forEach((instance, instanceId) => {
      if (instance.status === "stopped" && instance.lastUpdate < cutoffTime) {
        this.deleteInstance(instanceId)
        removedCount++
      }
    })

    if (removedCount > 0) {
      console.log(`[v0] Cleaned up ${removedCount} old instances`)
    }

    return removedCount
  }

  // Get statistics about all instances
  getStats(): {
    total: number
    running: number
    stopped: number
    error: number
    oldestInstance: Date | null
    newestInstance: Date | null
  } {
    const instances = this.getAllInstances()

    const stats = {
      total: instances.length,
      running: instances.filter((i) => i.status === "running").length,
      stopped: instances.filter((i) => i.status === "stopped").length,
      error: instances.filter((i) => i.status === "error").length,
      oldestInstance: null as Date | null,
      newestInstance: null as Date | null,
    }

    if (instances.length > 0) {
      const dates = instances.map((i) => i.lastUpdate)
      stats.oldestInstance = new Date(Math.min(...dates.map((d) => d.getTime())))
      stats.newestInstance = new Date(Math.max(...dates.map((d) => d.getTime())))
    }

    return stats
  }
}

// Global instance manager
export const instanceManager = new InstanceManager()

// Cleanup old instances every hour
setInterval(
  () => {
    instanceManager.cleanupOldInstances()
  },
  60 * 60 * 1000,
)
