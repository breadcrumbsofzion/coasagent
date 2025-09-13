import type { AgentConfig } from "./types"

export interface RSSItem {
  title: string
  content: string
  pubDate: string
  category: string
  guid: string
}

export interface FeedItem {
  format: string
  item: RSSItem
  timestamp: Date
}

export class RSSFeedManager {
  private feeds: Map<string, RSSItem[]> = new Map()
  private maxItemsPerFeed = 50

  addItem(format: string, content: string, config: AgentConfig, sourceAttribution: string): void {
    if (!this.feeds.has(format)) {
      this.feeds.set(format, [])
    }

    const feed = this.feeds.get(format)!
    const now = new Date()

    const item: RSSItem = {
      title: this.generateTitle(content, config, format),
      content: this.formatContent(content, sourceAttribution, format),
      pubDate: now.toUTCString(),
      category: this.generateCategory(config),
      guid: `coasagent-${format}-${now.getTime()}`,
    }

    // Add to beginning of array (newest first)
    feed.unshift(item)

    // Keep only the most recent items
    if (feed.length > this.maxItemsPerFeed) {
      feed.splice(this.maxItemsPerFeed)
    }

    console.log(`[v0] Added RSS item to ${format} feed (${feed.length} total items)`)
  }

  getFeedXML(format: string): string | null {
    const feed = this.feeds.get(format)
    if (!feed || feed.length === 0) {
      return null
    }

    const channelTitle = `COASAGENT - ${format.charAt(0).toUpperCase() + format.slice(1)} Mode`
    const channelDescription = `AI-generated content in ${format} format from COASAGENT`
    const channelLink = `https://coasagent.example.com/rss/${format}`

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${this.escapeXML(channelTitle)}</title>
    <description>${this.escapeXML(channelDescription)}</description>
    <link>${channelLink}</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>COASAGENT v1.0</generator>
    <language>en-us</language>
    <ttl>60</ttl>
`

    feed.forEach((item) => {
      xml += `    <item>
      <title>${this.escapeXML(item.title)}</title>
      <description><![CDATA[${item.content}]]></description>
      <pubDate>${item.pubDate}</pubDate>
      <category>${this.escapeXML(item.category)}</category>
      <guid isPermaLink="false">${item.guid}</guid>
      <link>${channelLink}#${item.guid}</link>
    </item>
`
    })

    xml += `  </channel>
</rss>`

    return xml
  }

  getLatestItems(limit = 20): FeedItem[] {
    const allItems: FeedItem[] = []

    this.feeds.forEach((items, format) => {
      items.forEach((item) => {
        allItems.push({
          format,
          item,
          timestamp: new Date(item.pubDate),
        })
      })
    })

    // Sort by timestamp (newest first)
    allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return allItems.slice(0, limit)
  }

  getFeedStats(): Record<string, { itemCount: number; lastUpdated: string | null }> {
    const stats: Record<string, { itemCount: number; lastUpdated: string | null }> = {}

    this.feeds.forEach((items, format) => {
      stats[format] = {
        itemCount: items.length,
        lastUpdated: items.length > 0 ? items[0].pubDate : null,
      }
    })

    return stats
  }

  getAllFormats(): string[] {
    return Array.from(this.feeds.keys())
  }

  clearFeed(format: string): void {
    this.feeds.delete(format)
    console.log(`[v0] Cleared ${format} RSS feed`)
  }

  clearAllFeeds(): void {
    this.feeds.clear()
    console.log(`[v0] Cleared all RSS feeds`)
  }

  private generateTitle(content: string, config: AgentConfig, format: string): string {
    const topic = config.role.focusTopic
    const timestamp = new Date().toLocaleDateString()

    switch (format) {
      case "question":
        return `Questions about ${topic} - ${timestamp}`
      case "emoji":
        return `${topic} in Emojis - ${timestamp}`
      case "quote":
        return `Quote of the Day: ${topic} - ${timestamp}`
      case "proverb":
        return `Proverb: ${topic} - ${timestamp}`
      case "info":
        return `6 Insights: ${topic} - ${timestamp}`
      case "csv":
        return `${topic} Data (CSV) - ${timestamp}`
      case "json":
        return `${topic} Data (JSON) - ${timestamp}`
      default:
        return `${topic} Update - ${timestamp}`
    }
  }

  private formatContent(content: string, sourceAttribution: string, format: string): string {
    let formattedContent = content

    // Add source attribution
    if (sourceAttribution) {
      formattedContent += `\n\n---\n${sourceAttribution}`
    }

    // Add format-specific styling
    switch (format) {
      case "csv":
      case "json":
        formattedContent = `<pre><code>${this.escapeHTML(formattedContent)}</code></pre>`
        break
      case "emoji":
        formattedContent = `<div style="font-size: 2em; text-align: center;">${formattedContent}</div>`
        break
      case "quote":
      case "proverb":
        formattedContent = `<blockquote style="font-style: italic; font-size: 1.2em; text-align: center; margin: 20px 0;">${formattedContent}</blockquote>`
        break
      default:
        // Convert line breaks to HTML
        formattedContent = formattedContent.replace(/\n/g, "<br>")
    }

    return formattedContent
  }

  private generateCategory(config: AgentConfig): string {
    const categories = []

    if (config.role.focusTopic) {
      categories.push(config.role.focusTopic.split(" ")[0]) // First word of focus topic
    }

    if (config.role.primaryRole) {
      categories.push(config.role.primaryRole.split(" ")[0]) // First word of role
    }

    categories.push("AI Generated")

    return categories.join(", ")
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  private escapeHTML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
  }
}
