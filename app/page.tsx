"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MapPin, Bot, Play, Square, Activity } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RSSDisplay } from "@/components/rss-display"

interface AgentConfig {
  location: {
    googleMapsPin: string
    radiusKm: number
  }
  role: {
    primaryRole: string
    focusTopic: string
    targetAudience: string
    searchPurpose: string
    dataPresentation: string
  }
  personalitySliders: {
    socialMood: number
    politicalBearing: number
    techSavviness: number
    presentationStyle: number
    contentDensity: number
  }
  contextOverride: string
  outputFormat: string
  dataSources: {
    llm: boolean
    internet: boolean
    reddit: boolean
    facebook: boolean
    twitter: boolean
    youtube: boolean
    instagram: boolean
  }
  modifiers: {
    hardFacts: boolean
    meaningFocus: boolean
    suggestiveMode: boolean
    strictGuidance: boolean
    laymanFriendly: boolean
    adultLanguage: boolean
    includeToolbox: boolean
    includeTips: boolean
  }
}

interface AgentInstance {
  id: string
  status: "running" | "stopped" | "error"
  lastUpdate: string
  config: {
    focusTopic: string
    outputFormat: string
    location: string
  }
}

export default function COASAGENTConfig() {
  const [config, setConfig] = useState<AgentConfig>({
    location: {
      googleMapsPin: "",
      radiusKm: 420,
    },
    role: {
      primaryRole: "",
      focusTopic: "",
      targetAudience: "",
      searchPurpose: "",
      dataPresentation: "",
    },
    personalitySliders: {
      socialMood: 0,
      politicalBearing: 0,
      techSavviness: 0,
      presentationStyle: 0,
      contentDensity: 0,
    },
    contextOverride: "",
    outputFormat: "normal",
    dataSources: {
      llm: false,
      internet: true,
      reddit: false,
      facebook: false,
      twitter: false,
      youtube: false,
      instagram: false,
    },
    modifiers: {
      hardFacts: false,
      meaningFocus: false,
      suggestiveMode: false,
      strictGuidance: false,
      laymanFriendly: false,
      adultLanguage: false,
      includeToolbox: false,
      includeTips: false,
    },
  })

  const [currentInstanceId, setCurrentInstanceId] = useState<string | null>(null)
  const [agentStatus, setAgentStatus] = useState<"stopped" | "running" | "error">("stopped")
  const [instances, setInstances] = useState<AgentInstance[]>([])
  const [loading, setLoading] = useState(false)

  // Check for extreme slider combinations
  const hasExtremeSliders = Object.values(config.personalitySliders).some((value) => Math.abs(value) > 7)
  const hasMultipleExtremes = Object.values(config.personalitySliders).filter((value) => Math.abs(value) > 7).length > 1

  const handleSliderChange = (key: keyof typeof config.personalitySliders, value: number[]) => {
    setConfig((prev) => ({
      ...prev,
      personalitySliders: {
        ...prev.personalitySliders,
        [key]: value[0],
      },
    }))
  }

  const handleDataSourceChange = (key: keyof typeof config.dataSources, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      dataSources: {
        ...prev.dataSources,
        [key]: checked,
      },
    }))
  }

  const handleModifierChange = (key: keyof typeof config.modifiers, checked: boolean) => {
    setConfig((prev) => ({
      ...prev,
      modifiers: {
        ...prev.modifiers,
        [key]: checked,
      },
    }))
  }

  const generateAgentConfig = () => {
    console.log("Generated Agent Config:", config)
  }

  const startAgent = async () => {
    if (!config.role.focusTopic || !config.role.searchPurpose) {
      alert("Please fill in the required fields: Focus Area and Search Purpose")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/agent/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        setCurrentInstanceId(data.instanceId)
        setAgentStatus("running")
        console.log(`[v0] Agent started with instance ID: ${data.instanceId}`)
      } else {
        console.error("Failed to start agent:", data.error)
        alert(`Failed to start agent: ${data.error}`)
      }
    } catch (error) {
      console.error("Error starting agent:", error)
      alert("Error starting agent. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const stopAgent = async () => {
    if (!currentInstanceId) return

    setLoading(true)
    try {
      const response = await fetch("/api/agent/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceId: currentInstanceId }),
      })

      const data = await response.json()

      if (data.success) {
        setAgentStatus("stopped")
        console.log(`[v0] Agent stopped: ${currentInstanceId}`)
      } else {
        console.error("Failed to stop agent:", data.error)
      }
    } catch (error) {
      console.error("Error stopping agent:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentStatus()

    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchAgentStatus, 30000)
    return () => clearInterval(interval)
  }, [currentInstanceId])

  const fetchAgentStatus = async () => {
    try {
      const response = await fetch("/api/agent/status")
      if (response.ok) {
        const data = await response.json()
        setInstances(data.instances)

        // Update current instance status
        if (currentInstanceId) {
          const currentInstance = data.instances.find((i: AgentInstance) => i.id === currentInstanceId)
          if (currentInstance) {
            setAgentStatus(currentInstance.status)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch agent status:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">COASAGENT</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Configure your AI RSS Agent to scan the internet and daily RSS feeds with highly relevant context based on
            dynamic outputs
          </p>
        </div>

        {instances.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Instances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {instances.map((instance) => (
                  <div key={instance.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant={
                          instance.status === "running"
                            ? "default"
                            : instance.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {instance.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(instance.lastUpdate).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{instance.config.focusTopic}</div>
                      <div className="text-muted-foreground capitalize">{instance.config.outputFormat} format</div>
                      {instance.config.location && (
                        <div className="text-muted-foreground text-xs">{instance.config.location}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Geographic & Role Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Geographic & Role Configuration
                </CardTitle>
                <CardDescription>Set your location focus and define the agent's role and purpose</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Google Maps Pin (Optional)</Label>
                    <Input
                      id="location"
                      placeholder="Enter location for focal point"
                      value={config.location.googleMapsPin}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          location: { ...prev.location, googleMapsPin: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Bot Role (Optional)</Label>
                    <Input
                      id="role"
                      placeholder="CPA and Devops engineer with hybrid roles"
                      value={config.role.primaryRole}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          role: { ...prev.role, primaryRole: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="focus">Focus Area *</Label>
                    <Input
                      id="focus"
                      placeholder="Accounting A.I. Apps and trends"
                      value={config.role.focusTopic}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          role: { ...prev.role, focusTopic: e.target.value },
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience (Optional)</Label>
                    <Input
                      id="audience"
                      placeholder="Medium size accounting firm with a big family"
                      value={config.role.targetAudience}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          role: { ...prev.role, targetAudience: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Search Purpose *</Label>
                    <Input
                      id="purpose"
                      placeholder="To help educate and raise awareness of the industry in/from web3"
                      value={config.role.searchPurpose}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          role: { ...prev.role, searchPurpose: e.target.value },
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="presentation">Data Presentation (Optional)</Label>
                    <Input
                      id="presentation"
                      placeholder="Succinct information, numbers and spreadsheets"
                      value={config.role.dataPresentation}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          role: { ...prev.role, dataPresentation: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personality Sliders */}
            <Card>
              <CardHeader>
                <CardTitle>Personality Configuration</CardTitle>
                <CardDescription>
                  Adjust the agent's personality traits (all default to 0, range -10 to +10)
                </CardDescription>
                {hasMultipleExtremes && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>⚠️ Extreme combinations may cause chaotic outputs</AlertDescription>
                  </Alert>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Social Mood</Label>
                      <Badge variant="outline">{config.personalitySliders.socialMood}</Badge>
                    </div>
                    <Slider
                      value={[config.personalitySliders.socialMood]}
                      onValueChange={(value) => handleSliderChange("socialMood", value)}
                      min={-10}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Very succinct & serious</span>
                      <span>Hilariously exaggerated & funny</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Political Bearing</Label>
                      <Badge variant="outline">{config.personalitySliders.politicalBearing}</Badge>
                    </div>
                    <Slider
                      value={[config.personalitySliders.politicalBearing]}
                      onValueChange={(value) => handleSliderChange("politicalBearing", value)}
                      min={-10}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Left</span>
                      <span>Right</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Tech Savviness</Label>
                      <Badge variant="outline">{config.personalitySliders.techSavviness}</Badge>
                    </div>
                    <Slider
                      value={[config.personalitySliders.techSavviness]}
                      onValueChange={(value) => handleSliderChange("techSavviness", value)}
                      min={-10}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Noob</span>
                      <span>Software Engineer</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Presentation Style</Label>
                      <Badge variant="outline">{config.personalitySliders.presentationStyle}</Badge>
                    </div>
                    <Slider
                      value={[config.personalitySliders.presentationStyle]}
                      onValueChange={(value) => handleSliderChange("presentationStyle", value)}
                      min={-10}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Casual</span>
                      <span>Professional</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Content Density</Label>
                      <Badge variant="outline">{config.personalitySliders.contentDensity}</Badge>
                    </div>
                    <Slider
                      value={[config.personalitySliders.contentDensity]}
                      onValueChange={(value) => handleSliderChange("contentDensity", value)}
                      min={-10}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Single Answers</span>
                      <span>Long datasets and detailed</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Context Override */}
            <Card>
              <CardHeader>
                <CardTitle>Context Override</CardTitle>
                <CardDescription>⚠️ This field will override/steer most other settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Additional instructions for the AI agent's behavior and focus..."
                  value={config.contextOverride}
                  onChange={(e) => setConfig((prev) => ({ ...prev, contextOverride: e.target.value }))}
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Output Format */}
            <Card>
              <CardHeader>
                <CardTitle>Output Format</CardTitle>
                <CardDescription>Select how the agent should format its output</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={config.outputFormat}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, outputFormat: value }))}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal">Normal output / plain-text</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="question" id="question" />
                    <Label htmlFor="question">Question mode (6 questions + summary)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="emoji" id="emoji" />
                    <Label htmlFor="emoji">Emoji mode (6 best emojis only)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="quote" id="quote" />
                    <Label htmlFor="quote">Quote mode (one insightful quote)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="info" id="info" />
                    <Label htmlFor="info">Info mode (6 informative insights)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="proverb" id="proverb" />
                    <Label htmlFor="proverb">Proverb mode (one insightful proverb)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv">.csv only (no descriptions)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json">.json only (no descriptions)</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Deep Search Sources</CardTitle>
                <CardDescription>Select which sources to perform deep dives on</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(config.dataSources).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) =>
                          handleDataSourceChange(key as keyof typeof config.dataSources, checked as boolean)
                        }
                      />
                      <Label htmlFor={key} className="capitalize">
                        {key}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Condition Modifiers */}
            <Card>
              <CardHeader>
                <CardTitle>Condition Modifiers</CardTitle>
                <CardDescription>Additional behavior modifiers for the agent</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hardFacts"
                      checked={config.modifiers.hardFacts}
                      onCheckedChange={(checked) => handleModifierChange("hardFacts", checked as boolean)}
                    />
                    <Label htmlFor="hardFacts" className="text-sm">
                      Hard facts 🔒 <span className="text-muted-foreground">(Overrides all personality settings)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="meaningFocus"
                      checked={config.modifiers.meaningFocus}
                      onCheckedChange={(checked) => handleModifierChange("meaningFocus", checked as boolean)}
                    />
                    <Label htmlFor="meaningFocus" className="text-sm">
                      Meaning focus
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="suggestiveMode"
                      checked={config.modifiers.suggestiveMode}
                      onCheckedChange={(checked) => handleModifierChange("suggestiveMode", checked as boolean)}
                    />
                    <Label htmlFor="suggestiveMode" className="text-sm">
                      Suggestive mode
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="strictGuidance"
                      checked={config.modifiers.strictGuidance}
                      onCheckedChange={(checked) => handleModifierChange("strictGuidance", checked as boolean)}
                    />
                    <Label htmlFor="strictGuidance" className="text-sm">
                      Strict guidance
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="laymanFriendly"
                      checked={config.modifiers.laymanFriendly}
                      onCheckedChange={(checked) => handleModifierChange("laymanFriendly", checked as boolean)}
                    />
                    <Label htmlFor="laymanFriendly" className="text-sm">
                      Layman friendly
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adultLanguage"
                      checked={config.modifiers.adultLanguage}
                      onCheckedChange={(checked) => handleModifierChange("adultLanguage", checked as boolean)}
                    />
                    <Label htmlFor="adultLanguage" className="text-sm">
                      Adult language
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeToolbox"
                      checked={config.modifiers.includeToolbox}
                      onCheckedChange={(checked) => handleModifierChange("includeToolbox", checked as boolean)}
                    />
                    <Label htmlFor="includeToolbox" className="text-sm">
                      Include TOP 10 Tools
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeTips"
                      checked={config.modifiers.includeTips}
                      onCheckedChange={(checked) => handleModifierChange("includeTips", checked as boolean)}
                    />
                    <Label htmlFor="includeTips" className="text-sm">
                      Include TOP 10 Tips
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Button onClick={generateAgentConfig} className="flex-1 min-w-[200px]">
                    Generate Agent Config
                  </Button>
                  <Button
                    onClick={startAgent}
                    disabled={agentStatus === "running" || loading}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    {loading ? "Starting..." : "Start Agent"}
                  </Button>
                  <Button
                    onClick={stopAgent}
                    disabled={agentStatus === "stopped" || loading}
                    variant="outline"
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <Square className="h-4 w-4" />
                    {loading ? "Stopping..." : "Stop Agent"}
                  </Button>
                </div>
                {agentStatus === "running" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Agent is running and will generate content every 4.2 minutes.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RSS Output Panel */}
          <div className="space-y-6">
            <RSSDisplay selectedFormat={config.outputFormat} agentStatus={agentStatus} />
          </div>
        </div>
      </div>
    </div>
  )
}
