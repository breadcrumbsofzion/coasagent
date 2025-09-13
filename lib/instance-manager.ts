import type { AgentConfig, AgentInstance, AgentOutput } from "./types"
import { AgentCore } from "./agent-core"

class InstanceManager {
  private instances: Map<string, AgentInstance> = new Map()
  private outputs: Map<string, AgentOutput[]> = new Map()
  private agentCore: AgentCore

  constructor() {
    this.agentCore = new AgentCore()
  }

  createInstance(config: AgentConfig): string {
    const id = `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const instance: AgentInstance = {
      id,
      config,
      status: "idle",
      createdAt: new Date(),
      runCount: 0,
    }

    this.instances.set(id, instance)
    this.outputs.set(id, [])

    console.log(`[v0] Created agent instance: ${id}`)
    return id
  }

  startInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      console.error(`[v0] Instance not found: ${instanceId}`)
      return false
    }

    if (instance.status === "running") {
      console.log(`[v0] Instance already running: ${instanceId}`)
      return true
    }

    try {
      // Start the agent with 42-second intervals
      const intervalId = setInterval(async () => {
        await this.runAgentCycle(instanceId)
      }, 42000) // 42 seconds

      instance.intervalId = intervalId
      instance.status = "running"
      instance.nextRunAt = new Date(Date.now() + 42000)

      console.log(`[v0] Started agent instance: ${instanceId}`)

      // Run immediately on start
      setTimeout(() => this.runAgentCycle(instanceId), 1000)

      return true
    } catch (error) {
      console.error(`[v0] Failed to start instance ${instanceId}:`, error)
      instance.status = "error"
      return false
    }
  }

  stopInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      console.error(`[v0] Instance not found: ${instanceId}`)
      return false
    }

    if (instance.intervalId) {
      clearInterval(instance.intervalId)
      instance.intervalId = undefined
    }

    instance.status = "stopped"
    console.log(`[v0] Stopped agent instance: ${instanceId}`)
    return true
  }

  private async runAgentCycle(instanceId: string): Promise<void> {
    const instance = this.instances.get(instanceId)
    if (!instance || instance.status !== "running") {
      return
    }

    try {
      console.log(`[v0] Running agent cycle for instance: ${instanceId}`)

      const startTime = Date.now()
      const content = await this.agentCore.generateContent(instance.config)
      const processingTime = Date.now() - startTime

      const output: AgentOutput = {
        id: `output-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        instanceId,
        content,
        timestamp: new Date(),
        sources: ["AI Generated", "Internet Search", "Social Media"],
        metadata: {
          model: this.agentCore.getCurrentModel(),
          processingTime,
          wordCount: content.split(/\s+/).length,
        },
      }

      const outputs = this.outputs.get(instanceId) || []
      outputs.unshift(output) // Add to beginning

      // Keep only last 50 outputs per instance
      if (outputs.length > 50) {
        outputs.splice(50)
      }

      this.outputs.set(instanceId, outputs)

      instance.lastRunAt = new Date()
      instance.nextRunAt = new Date(Date.now() + 42000)
      instance.runCount++

      console.log(`[v0] Agent cycle completed for ${instanceId} (${processingTime}ms)`)
    } catch (error) {
      console.error(`[v0] Agent cycle failed for ${instanceId}:`, error)
      instance.status = "error"
    }
  }

  getInstance(instanceId: string): AgentInstance | undefined {
    return this.instances.get(instanceId)
  }

  getAllInstances(): AgentInstance[] {
    return Array.from(this.instances.values())
  }

  getRunningInstances(): AgentInstance[] {
    return Array.from(this.instances.values()).filter((instance) => instance.status === "running")
  }

  getInstanceOutputs(instanceId: string): AgentOutput[] {
    return this.outputs.get(instanceId) || []
  }

  getAllOutputs(): AgentOutput[] {
    const allOutputs: AgentOutput[] = []
    for (const outputs of this.outputs.values()) {
      allOutputs.push(...outputs)
    }
    return allOutputs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  deleteInstance(instanceId: string): boolean {
    const instance = this.instances.get(instanceId)
    if (!instance) {
      return false
    }

    this.stopInstance(instanceId)
    this.instances.delete(instanceId)
    this.outputs.delete(instanceId)

    console.log(`[v0] Deleted agent instance: ${instanceId}`)
    return true
  }
}

// Export singleton instance
export const instanceManager = new InstanceManager()
