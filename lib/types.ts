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

export interface ProcessedContent {
  id: string
  source: string
  timestamp: Date
  rawContent: string
  processedContent: string
  relevanceScores: {
    geographic: number
    topic: number
    overall: number
  }
  metadata: {
    locationMentions: string[]
    keyTopics: string[]
    sentiment: number
    technicalLevel: number
  }
}

export interface AgentInstance {
  id: string
  config: AgentConfig
  status: "running" | "stopped" | "error"
  lastUpdate: Date
  cronJob?: any
}
