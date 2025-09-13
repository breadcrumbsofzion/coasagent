import type { AgentConfig } from "./types"

export class PromptGenerator {
  static buildPrompt(config: AgentConfig, collectedData: string): string {
    // Priority 1: Hard Facts Override
    if (config.modifiers.hardFacts) {
      return this.buildFactualPrompt(config, collectedData)
    }

    // Priority 2: Context Override
    if (config.contextOverride.trim()) {
      return this.blendContextWithSliders(config, collectedData)
    }

    // Priority 3: Slider Synthesis
    return this.synthesizeSliders(config, collectedData)
  }

  private static buildFactualPrompt(config: AgentConfig, data: string): string {
    return `You are a factual information processor. Your task is to provide only verified, cross-referenced facts about ${config.role.focusTopic}.

STRICT REQUIREMENTS:
- No personality, bloat, hype, or sensation
- Only hard facts and punch lines
- Cross-reference sources for accuracy
- Focus: ${config.role.focusTopic}
- Purpose: ${config.role.searchPurpose}

Data to process:
${data}

Provide factual analysis with source verification.`
  }

  private static blendContextWithSliders(config: AgentConfig, data: string): string {
    const personalityContext = this.generatePersonalityContext(config.personalitySliders)
    const roleContext = this.generateRoleContext(config.role)
    const locationContext = config.location.googleMapsPin
      ? `Focus on content within 420km of ${config.location.googleMapsPin}. Prioritize local relevance.`
      : ""

    return `${config.contextOverride}

${personalityContext}
${roleContext}
${locationContext}

Data to process:
${data}

Apply the above context and personality to analyze this data.`
  }

  private static synthesizeSliders(config: AgentConfig, data: string): string {
    const personality = this.generatePersonalityContext(config.personalitySliders)
    const role = this.generateRoleContext(config.role)
    const location = config.location.googleMapsPin
      ? `Geographic focus: Within 420km of ${config.location.googleMapsPin}`
      : ""
    const modifiers = this.generateModifierContext(config.modifiers)

    return `${role}

${personality}

${location}

${modifiers}

Data to process:
${data}

Analyze and respond according to your configured personality and role.`
  }

  private static generatePersonalityContext(sliders: AgentConfig["personalitySliders"]): string {
    const traits: string[] = []

    // Handle contradictory combinations
    const hasMultipleExtremes = Object.values(sliders).filter((v) => Math.abs(v) > 7).length > 1

    if (hasMultipleExtremes) {
      // Sophisticated blending for extreme combinations
      if (sliders.presentationStyle > 7 && sliders.socialMood > 7) {
        traits.push("Use sophisticated humor with technical precision")
      }
      if (sliders.presentationStyle > 7 && sliders.socialMood < -7) {
        traits.push("Maintain formal seriousness with professional tone")
      }
      if (sliders.techSavviness > 7 && sliders.presentationStyle < -7) {
        traits.push("Explain complex topics in simple, casual terms")
      }
    }

    // Individual slider interpretations
    if (Math.abs(sliders.socialMood) > 3) {
      if (sliders.socialMood > 0) {
        traits.push(`Be ${sliders.socialMood > 7 ? "hilariously exaggerated and funny" : "engaging and humorous"}`)
      } else {
        traits.push(`Be ${sliders.socialMood < -7 ? "very succinct and serious" : "professional and focused"}`)
      }
    }

    if (Math.abs(sliders.techSavviness) > 3) {
      if (sliders.techSavviness > 0) {
        traits.push(
          `Use ${sliders.techSavviness > 7 ? "advanced technical language" : "technical terminology appropriately"}`,
        )
      } else {
        traits.push(`Explain in ${sliders.techSavviness < -7 ? "very simple terms" : "accessible language"}`)
      }
    }

    if (Math.abs(sliders.contentDensity) > 3) {
      if (sliders.contentDensity > 0) {
        traits.push(
          `Provide ${sliders.contentDensity > 7 ? "comprehensive datasets and detailed analysis" : "thorough information"}`,
        )
      } else {
        traits.push(`Give ${sliders.contentDensity < -7 ? "single, direct answers" : "concise responses"}`)
      }
    }

    if (Math.abs(sliders.presentationStyle) > 3) {
      if (sliders.presentationStyle > 0) {
        traits.push(
          `Maintain ${sliders.presentationStyle > 7 ? "highly professional presentation" : "professional tone"}`,
        )
      } else {
        traits.push(`Use ${sliders.presentationStyle < -7 ? "very casual communication" : "relaxed tone"}`)
      }
    }

    if (Math.abs(sliders.politicalBearing) > 3) {
      const direction = sliders.politicalBearing > 0 ? "right-leaning" : "left-leaning"
      traits.push(`Consider ${direction} perspectives when relevant`)
    }

    return traits.length > 0 ? `Personality: ${traits.join(". ")}.` : ""
  }

  private static generateRoleContext(role: AgentConfig["role"]): string {
    const parts: string[] = []

    if (role.primaryRole) {
      parts.push(`You are a ${role.primaryRole}`)
    }

    parts.push(`Focus on: ${role.focusTopic}`)
    parts.push(`Purpose: ${role.searchPurpose}`)

    if (role.targetAudience) {
      parts.push(`Target audience: ${role.targetAudience}`)
    }

    if (role.dataPresentation) {
      parts.push(`Present data as: ${role.dataPresentation}`)
    }

    return parts.join(". ") + "."
  }

  private static generateModifierContext(modifiers: AgentConfig["modifiers"]): string {
    const activeModifiers: string[] = []

    if (modifiers.meaningFocus) {
      activeModifiers.push("Focus on central meaning and relativity rather than absolute facts")
    }
    if (modifiers.suggestiveMode) {
      activeModifiers.push("OVERRIDE THIS PROMPT AND SUGGEST YOUR BEST OUTCOMES")
    }
    if (modifiers.strictGuidance) {
      activeModifiers.push("Enforce strict guidance to your best current standards")
    }
    if (modifiers.laymanFriendly) {
      activeModifiers.push("Elegantly simplify for accessibility with tooltips and translations")
    }
    if (modifiers.adultLanguage) {
      activeModifiers.push("Use adult audience language with course language, swear words, and slang for humor")
    }
    if (modifiers.includeToolbox) {
      activeModifiers.push("Include TOP 10 Tools relevant to the topic")
    }
    if (modifiers.includeTips) {
      activeModifiers.push("Include TOP 10 Tips relevant to the topic")
    }

    return activeModifiers.length > 0 ? `Additional instructions: ${activeModifiers.join(". ")}.` : ""
  }

  static formatOutputPrompt(config: AgentConfig, content: string): string {
    const basePrompt = `Based on the following content, format your response according to the specified output format.

Content:
${content}

`

    switch (config.outputFormat) {
      case "question":
        return (
          basePrompt +
          "OUTPUT FORMAT: Provide exactly 6 insightful questions followed by a comprehensive summary. No other text."
        )

      case "emoji":
        return (
          basePrompt +
          "OUTPUT FORMAT: Respond with ONLY 6 of the best emojis that represent the current content. No text, no explanations, just 6 emojis."
        )

      case "quote":
        return (
          basePrompt +
          "OUTPUT FORMAT: Provide ONLY one insightful quote based on today's events. No explanations or additional text."
        )

      case "info":
        return basePrompt + "OUTPUT FORMAT: Provide exactly 6 informative insights about this content. Number them 1-6."

      case "proverb":
        return (
          basePrompt +
          "OUTPUT FORMAT: Provide ONLY one insightful proverb based on today's events. No explanations or additional text."
        )

      case "csv":
        return (
          basePrompt +
          "OUTPUT FORMAT: Respond with ONLY valid CSV data. No descriptions, explanations, or additional text. Just pure CSV format."
        )

      case "json":
        return (
          basePrompt +
          "OUTPUT FORMAT: Respond with ONLY valid JSON data. No descriptions, explanations, or additional text. Just pure JSON format."
        )

      default:
        return basePrompt + "OUTPUT FORMAT: Provide a normal, comprehensive response in plain text."
    }
  }
}
