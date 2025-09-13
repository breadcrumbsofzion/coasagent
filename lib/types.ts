export interface AgentConfig {
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

export interface AgentInstance {
  id: string
  config: AgentConfig
  status: "idle" | "running" | "stopped" | "error"
  createdAt: Date
  lastRunAt?: Date
  nextRunAt?: Date
  runCount: number
  intervalId?: NodeJS.Timeout
}

export interface AgentOutput {
  id: string
  instanceId: string
  content: string
  timestamp: Date
  sources: string[]
  metadata: {
    model: string
    processingTime: number
    wordCount: number
  }
}

export interface RSSItem {
  title: string
  description: string
  link: string
  pubDate: string
  guid: string
  category?: string
  author?: string
}

export interface ProcessedContent {
  title: string
  content: string
  summary: string
  sources: string[]
  timestamp: Date
  metadata: {
    wordCount: number
    readingTime: number
    topics: string[]
    sentiment: "positive" | "neutral" | "negative"
  }
}
