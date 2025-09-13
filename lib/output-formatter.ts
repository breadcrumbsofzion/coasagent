export class OutputFormatter {
  static async validateAndFormat(content: string, format: string): Promise<string> {
    try {
      switch (format) {
        case "csv":
          return this.validateCSV(content)

        case "json":
          return this.validateJSON(content)

        case "emoji":
          return this.validateEmoji(content)

        case "quote":
        case "proverb":
          return this.validateSingleLine(content)

        case "question":
          return this.validateQuestions(content)

        case "info":
          return this.validateInsights(content)

        default:
          return content // Plain text, no validation needed
      }
    } catch (error) {
      console.log(`[v0] Format validation failed for ${format}, falling back to plain text`)
      return `Format validation failed. Original content:\n\n${content}`
    }
  }

  private static validateCSV(content: string): string {
    // Basic CSV validation
    const lines = content.trim().split("\n")
    if (lines.length === 0) {
      throw new Error("Empty CSV content")
    }

    // Check if it looks like CSV (has commas, consistent column count)
    const firstLineColumns = lines[0].split(",").length
    const isValidCSV = lines.every((line) => {
      const columns = line.split(",").length
      return columns === firstLineColumns
    })

    if (!isValidCSV) {
      throw new Error("Invalid CSV format")
    }

    return content.trim()
  }

  private static validateJSON(content: string): string {
    try {
      // Try to parse as JSON
      JSON.parse(content.trim())
      return content.trim()
    } catch {
      throw new Error("Invalid JSON format")
    }
  }

  private static validateEmoji(content: string): string {
    // Extract emojis from content
    const emojiRegex =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
    const emojis = content.match(emojiRegex) || []

    if (emojis.length !== 6) {
      throw new Error(`Expected exactly 6 emojis, got ${emojis.length}`)
    }

    return emojis.join(" ")
  }

  private static validateSingleLine(content: string): string {
    const cleaned = content.trim()
    const lines = cleaned.split("\n").filter((line) => line.trim())

    if (lines.length !== 1) {
      // Try to extract the main quote/proverb
      const quoteLine = lines.find((line) => line.includes('"') || line.includes("'") || line.length > 20)

      if (quoteLine) {
        return quoteLine.trim()
      }

      throw new Error("Expected single line content")
    }

    return lines[0]
  }

  private static validateQuestions(content: string): string {
    const lines = content.split("\n").filter((line) => line.trim())
    const questions = lines.filter((line) => line.includes("?"))

    if (questions.length < 6) {
      throw new Error(`Expected at least 6 questions, got ${questions.length}`)
    }

    return content
  }

  private static validateInsights(content: string): string {
    const lines = content.split("\n").filter((line) => line.trim())
    const numberedInsights = lines.filter((line) => /^\d+\./.test(line.trim()))

    if (numberedInsights.length < 6) {
      throw new Error(`Expected at least 6 numbered insights, got ${numberedInsights.length}`)
    }

    return content
  }
}
