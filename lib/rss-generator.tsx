export interface RSSItem {
  id: string
  title: string
  content: string
  pubDate: Date
  category: string
  sourceAttribution: string
  link?: string
}

export interface RSSFeed {
  channel: {
    title: string
    description: string
    category: string
    lastUpdated: Date
    generator: string
    link: string
  }
  items: RSSItem[]
}

export class RSSGenerator {
  static generateXML(feed: RSSFeed): string {
    const escapeXML = (str: string): string => {
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
    }

    const formatDate = (date: Date): string => {
      return date.toUTCString()
    }

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXML(feed.channel.title)}</title>
    <description>${escapeXML(feed.channel.description)}</description>
    <link>${escapeXML(feed.channel.link)}</link>
    <lastBuildDate>${formatDate(feed.channel.lastUpdated)}</lastBuildDate>
    <generator>${escapeXML(feed.channel.generator)}</generator>
    <category>${escapeXML(feed.channel.category)}</category>
    <atom:link href="${escapeXML(feed.channel.link)}" rel="self" type="application/rss+xml" />
`

    feed.items.forEach((item) => {
      xml += `
    <item>
      <guid isPermaLink="false">${escapeXML(item.id)}</guid>
      <title>${escapeXML(item.title)}</title>
      <link>${escapeXML(item.link || feed.channel.link)}</link>
      <pubDate>${formatDate(item.pubDate)}</pubDate>
      <category>${escapeXML(item.category)}</category>
      <description>${escapeXML(item.sourceAttribution)}</description>
      <content:encoded><![CDATA[${item.content}]]></content:encoded>
    </item>`
    })

    xml += `
  </channel>
</rss>`

    return xml
  }

  static createFeedForFormat(format: string, content: string, config: any, sourceAttribution: string): RSSFeed {
    const baseUrl = "https://coasagent.example.com"
    const timestamp = new Date()

    const formatTitles: Record<string, string> = {
      normal: "COASAGENT - Normal Output",
      question: "COASAGENT - Question Mode",
      emoji: "COASAGENT - Emoji Mode",
      quote: "COASAGENT - Quote Mode",
      info: "COASAGENT - Info Insights",
      proverb: "COASAGENT - Proverb Mode",
      csv: "COASAGENT - CSV Data",
      json: "COASAGENT - JSON Data",
    }

    const formatDescriptions: Record<string, string> = {
      normal: "AI-generated insights and analysis in plain text format",
      question: "Six insightful questions with comprehensive summaries",
      emoji: "Best emojis representing current trends and insights",
      quote: "Insightful quotes based on current events and trends",
      info: "Six informative insights into current topics",
      proverb: "Wisdom and proverbs based on current events",
      csv: "Structured data in CSV format for analysis",
      json: "Structured data in JSON format for integration",
    }

    const item: RSSItem = {
      id: `coasagent-${format}-${timestamp.getTime()}`,
      title: this.generateItemTitle(format, config, timestamp),
      content: content,
      pubDate: timestamp,
      category: format,
      sourceAttribution: sourceAttribution,
      link: `${baseUrl}/rss/${format}`,
    }

    return {
      channel: {
        title: formatTitles[format] || "COASAGENT - Unknown Format",
        description: formatDescriptions[format] || "AI-generated content",
        category: format,
        lastUpdated: timestamp,
        generator: "COASAGENT v1.0",
        link: `${baseUrl}/rss/${format}`,
      },
      items: [item],
    }
  }

  private static generateItemTitle(format: string, config: any, timestamp: Date): string {
    const dateStr = timestamp.toLocaleDateString()
    const timeStr = timestamp.toLocaleTimeString()

    const baseTopic = config.role?.focusTopic || "General Topics"

    switch (format) {
      case "question":
        return `6 Questions About ${baseTopic} - ${dateStr}`
      case "emoji":
        return `Top Emojis for ${baseTopic} - ${dateStr}`
      case "quote":
        return `Daily Quote: ${baseTopic} - ${dateStr}`
      case "info":
        return `6 Insights: ${baseTopic} - ${dateStr}`
      case "proverb":
        return `Daily Proverb: ${baseTopic} - ${dateStr}`
      case "csv":
        return `${baseTopic} Data (CSV) - ${dateStr}`
      case "json":
        return `${baseTopic} Data (JSON) - ${dateStr}`
      default:
        return `${baseTopic} Analysis - ${dateStr} ${timeStr}`
    }
  }
}

export class RSSFeedManager {
  private feeds: Map<string, RSSFeed> = new Map()
  private maxItemsPerFeed = 50

  addItem(format: string, content: string, config: any, sourceAttribution: string): void {
    const newFeed = RSSGenerator.createFeedForFormat(format, content, config, sourceAttribution)
    const existingFeed = this.feeds.get(format)

    if (existingFeed) {
      // Add new item to existing feed
      existingFeed.items.unshift(newFeed.items[0])
      existingFeed.channel.lastUpdated = new Date()

      // Limit feed size
      if (existingFeed.items.length > this.maxItemsPerFeed) {
        existingFeed.items = existingFeed.items.slice(0, this.maxItemsPerFeed)
      }
    } else {
      // Create new feed
      this.feeds.set(format, newFeed)
    }

    console.log(`[v0] Added item to ${format} RSS feed. Total items: ${this.feeds.get(format)?.items.length}`)
  }

  getFeed(format: string): RSSFeed | null {
    return this.feeds.get(format) || null
  }

  getFeedXML(format: string): string | null {
    const feed = this.getFeed(format)
    return feed ? RSSGenerator.generateXML(feed) : null
  }

  getAllFormats(): string[] {
    return Array.from(this.feeds.keys())
  }

  getLatestItems(limit = 10): Array<{ format: string; item: RSSItem }> {
    const allItems: Array<{ format: string; item: RSSItem }> = []

    this.feeds.forEach((feed, format) => {
      feed.items.forEach((item) => {
        allItems.push({ format, item })
      })
    })

    // Sort by publication date (newest first)
    allItems.sort((a, b) => b.item.pubDate.getTime() - a.item.pubDate.getTime())

    return allItems.slice(0, limit)
  }

  getFeedStats(): Record<string, { itemCount: number; lastUpdated: Date | null }> {
    const stats: Record<string, { itemCount: number; lastUpdated: Date | null }> = {}

    this.feeds.forEach((feed, format) => {
      stats[format] = {
        itemCount: feed.items.length,
        lastUpdated: feed.channel.lastUpdated,
      }
    })

    return stats
  }

  clearOldItems(maxAgeHours = 168): void {
    // Default: keep items for 1 week (168 hours)
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000)

    this.feeds.forEach((feed, format) => {
      const originalCount = feed.items.length
      feed.items = feed.items.filter((item) => item.pubDate > cutoffTime)
      const removedCount = originalCount - feed.items.length

      if (removedCount > 0) {
        console.log(`[v0] Removed ${removedCount} old items from ${format} feed`)
      }
    })
  }

  exportAllFeeds(): Record<string, string> {
    const exports: Record<string, string> = {}

    this.feeds.forEach((feed, format) => {
      exports[format] = RSSGenerator.generateXML(feed)
    })

    return exports
  }
}
