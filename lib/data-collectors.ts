import type { ProcessedContent, AgentConfig } from "./types"
import { GeoProcessor } from "./geo-processor"

export abstract class DataCollector {
  abstract collect(config: AgentConfig): Promise<ProcessedContent[]>

  protected async calculateRelevanceScores(
    content: string,
    config: AgentConfig,
  ): Promise<{ geographic: number; topic: number; overall: number }> {
    // Geographic relevance
    const geoResult = await GeoProcessor.calculateRelevanceScore(content, config.location.googleMapsPin)

    // Topic relevance (simple keyword matching - in production, use semantic similarity)
    const topicScore = this.calculateTopicRelevance(content, config.role.focusTopic)

    // Overall score combines both
    const overall = (geoResult.geographic + topicScore) / 2

    return {
      geographic: geoResult.geographic,
      topic: topicScore,
      overall,
    }
  }

  private calculateTopicRelevance(content: string, focusTopic: string): number {
    const contentLower = content.toLowerCase()
    const topicWords = focusTopic.toLowerCase().split(/\s+/)

    let matches = 0
    const totalWords = topicWords.length

    topicWords.forEach((word) => {
      if (contentLower.includes(word)) {
        matches++
      }
    })

    // Bonus for exact phrase match
    if (contentLower.includes(focusTopic.toLowerCase())) {
      matches += topicWords.length * 0.5
    }

    return Math.min(matches / totalWords, 1.0)
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

export class RSSCollector extends DataCollector {
  private feedUrls = [
    "https://feeds.feedburner.com/oreilly/radar",
    "https://techcrunch.com/feed/",
    "https://www.wired.com/feed/rss",
    "https://rss.cnn.com/rss/edition.rss",
    "https://feeds.reuters.com/reuters/technologyNews",
  ]

  async collect(config: AgentConfig): Promise<ProcessedContent[]> {
    const results: ProcessedContent[] = []

    console.log(`[v0] Collecting RSS feeds for topic: ${config.role.focusTopic}`)

    for (const feedUrl of this.feedUrls) {
      try {
        const items = await this.fetchFeed(feedUrl)
        for (const item of items) {
          const relevanceScores = await this.calculateRelevanceScores(item.content, config)

          // Only include items with reasonable relevance
          if (relevanceScores.overall > 0.2) {
            results.push({
              id: this.generateId(),
              source: `RSS: ${feedUrl}`,
              timestamp: new Date(item.pubDate || Date.now()),
              rawContent: item.content,
              processedContent: item.content,
              relevanceScores,
              metadata: {
                locationMentions: GeoProcessor.extractLocations(item.content),
                keyTopics: this.extractKeyTopics(item.content),
                sentiment: this.calculateSentiment(item.content),
                technicalLevel: this.assessTechnicalLevel(item.content),
              },
            })
          }
        }
      } catch (error) {
        console.log(`[v0] Failed to fetch RSS feed ${feedUrl}:`, error)
      }
    }

    console.log(`[v0] Collected ${results.length} relevant RSS items`)
    return results
  }

  private async fetchFeed(url: string): Promise<Array<{ content: string; pubDate?: string }>> {
    // Mock RSS feed data - in production, use a proper RSS parser
    await new Promise((resolve) => setTimeout(resolve, 500))

    const mockItems = [
      {
        content: `AI and Machine Learning trends in accounting software are revolutionizing how businesses manage their finances. New tools are emerging that can automatically categorize expenses, detect fraud, and provide predictive analytics for cash flow management.`,
        pubDate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      },
      {
        content: `Web3 technologies are being adopted by accounting firms to provide more transparent and secure financial reporting. Blockchain-based ledgers offer immutable records that can enhance audit trails.`,
        pubDate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      },
      {
        content: `The latest DevOps practices are helping accounting software companies deploy updates more frequently and reliably. Continuous integration and deployment pipelines are becoming standard.`,
        pubDate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      },
    ]

    return mockItems
  }

  private extractKeyTopics(content: string): string[] {
    // Simple keyword extraction - in production, use NLP
    const keywords = content
      .toLowerCase()
      .match(
        /\b(?:ai|artificial intelligence|machine learning|blockchain|web3|accounting|finance|devops|automation|analytics)\b/g,
      )
    return [...new Set(keywords || [])]
  }

  private calculateSentiment(content: string): number {
    // Simple sentiment analysis - in production, use proper sentiment analysis
    const positiveWords = ["good", "great", "excellent", "amazing", "revolutionary", "innovative", "efficient"]
    const negativeWords = ["bad", "terrible", "awful", "problematic", "challenging", "difficult", "concerning"]

    const words = content.toLowerCase().split(/\s+/)
    let score = 0

    words.forEach((word) => {
      if (positiveWords.includes(word)) score += 1
      if (negativeWords.includes(word)) score -= 1
    })

    return Math.max(-1, Math.min(1, (score / words.length) * 10))
  }

  private assessTechnicalLevel(content: string): number {
    // Assess technical complexity 1-10
    const technicalTerms = [
      "api",
      "algorithm",
      "database",
      "framework",
      "architecture",
      "deployment",
      "integration",
      "scalability",
      "optimization",
      "infrastructure",
    ]

    const words = content.toLowerCase().split(/\s+/)
    const technicalCount = words.filter((word) => technicalTerms.includes(word)).length

    return Math.min(10, Math.max(1, (technicalCount / words.length) * 100))
  }
}

export class SocialMediaCollector extends DataCollector {
  async collect(config: AgentConfig): Promise<ProcessedContent[]> {
    const results: ProcessedContent[] = []

    console.log(`[v0] Collecting social media content for topic: ${config.role.focusTopic}`)

    // Collect from enabled sources
    if (config.dataSources.reddit) {
      results.push(...(await this.collectReddit(config)))
    }
    if (config.dataSources.twitter) {
      results.push(...(await this.collectTwitter(config)))
    }
    if (config.dataSources.youtube) {
      results.push(...(await this.collectYouTube(config)))
    }

    console.log(`[v0] Collected ${results.length} social media items`)
    return results
  }

  private async collectReddit(config: AgentConfig): Promise<ProcessedContent[]> {
    // Mock Reddit data - in production, use Reddit API
    await new Promise((resolve) => setTimeout(resolve, 300))

    const mockPosts = [
      {
        content: `Just implemented a new AI-powered expense categorization system for our accounting firm. The accuracy is incredible - it's correctly categorizing 95% of transactions automatically. Game changer for small businesses!`,
        subreddit: "accounting",
        score: 156,
      },
      {
        content: `Has anyone tried using blockchain for audit trails? We're considering implementing it but want to hear real-world experiences from other CPAs.`,
        subreddit: "CPA",
        score: 89,
      },
      {
        content: `DevOps practices in fintech: Our team reduced deployment time from 2 hours to 15 minutes using automated CI/CD pipelines. Here's what we learned...`,
        subreddit: "devops",
        score: 234,
      },
    ]

    const results: ProcessedContent[] = []

    for (const post of mockPosts) {
      const relevanceScores = await this.calculateRelevanceScores(post.content, config)

      if (relevanceScores.overall > 0.3) {
        results.push({
          id: this.generateId(),
          source: `Reddit: r/${post.subreddit}`,
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          rawContent: post.content,
          processedContent: post.content,
          relevanceScores,
          metadata: {
            locationMentions: GeoProcessor.extractLocations(post.content),
            keyTopics: this.extractKeyTopics(post.content),
            sentiment: this.calculateSentiment(post.content),
            technicalLevel: this.assessTechnicalLevel(post.content),
          },
        })
      }
    }

    return results
  }

  private async collectTwitter(config: AgentConfig): Promise<ProcessedContent[]> {
    // Mock Twitter data - in production, use Twitter API
    await new Promise((resolve) => setTimeout(resolve, 400))

    const mockTweets = [
      {
        content: `🚀 New AI accounting tools are making bookkeeping so much easier! Just saved 3 hours of manual data entry. #AccountingAI #Fintech`,
        likes: 45,
        retweets: 12,
      },
      {
        content: `Web3 is transforming how we think about financial transparency. Blockchain-based accounting could be the future of audit trails. Thoughts? #Web3 #Accounting`,
        likes: 78,
        retweets: 23,
      },
      {
        content: `DevOps best practices for financial software: Always test your deployment pipeline with real transaction data. Learned this the hard way! #DevOps #Fintech`,
        likes: 156,
        retweets: 34,
      },
    ]

    const results: ProcessedContent[] = []

    for (const tweet of mockTweets) {
      const relevanceScores = await this.calculateRelevanceScores(tweet.content, config)

      if (relevanceScores.overall > 0.3) {
        results.push({
          id: this.generateId(),
          source: "Twitter",
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          rawContent: tweet.content,
          processedContent: tweet.content,
          relevanceScores,
          metadata: {
            locationMentions: GeoProcessor.extractLocations(tweet.content),
            keyTopics: this.extractKeyTopics(tweet.content),
            sentiment: this.calculateSentiment(tweet.content),
            technicalLevel: this.assessTechnicalLevel(tweet.content),
          },
        })
      }
    }

    return results
  }

  private async collectYouTube(config: AgentConfig): Promise<ProcessedContent[]> {
    // Mock YouTube data - in production, use YouTube API
    await new Promise((resolve) => setTimeout(resolve, 600))

    const mockVideos = [
      {
        content: `Video: "AI Revolution in Accounting: 10 Tools Every CPA Should Know" - Comprehensive overview of the latest AI-powered accounting software, including automated bookkeeping, fraud detection, and predictive analytics tools.`,
        views: 15420,
        duration: "12:34",
      },
      {
        content: `Video: "Blockchain for Accountants: Web3 Meets Traditional Finance" - Deep dive into how blockchain technology is being integrated into accounting practices, with real-world case studies from progressive firms.`,
        views: 8930,
        duration: "18:45",
      },
    ]

    const results: ProcessedContent[] = []

    for (const video of mockVideos) {
      const relevanceScores = await this.calculateRelevanceScores(video.content, config)

      if (relevanceScores.overall > 0.3) {
        results.push({
          id: this.generateId(),
          source: "YouTube",
          timestamp: new Date(Date.now() - Math.random() * 86400000),
          rawContent: video.content,
          processedContent: video.content,
          relevanceScores,
          metadata: {
            locationMentions: GeoProcessor.extractLocations(video.content),
            keyTopics: this.extractKeyTopics(video.content),
            sentiment: this.calculateSentiment(video.content),
            technicalLevel: this.assessTechnicalLevel(video.content),
          },
        })
      }
    }

    return results
  }

  private extractKeyTopics(content: string): string[] {
    const keywords = content
      .toLowerCase()
      .match(/\b(?:ai|ml|blockchain|web3|accounting|finance|devops|automation|analytics|fintech|cpa)\b/g)
    return [...new Set(keywords || [])]
  }

  private calculateSentiment(content: string): number {
    const positiveWords = ["great", "amazing", "revolutionary", "efficient", "game changer", "🚀", "💡"]
    const negativeWords = ["difficult", "challenging", "problematic", "hard way", "failed"]

    const contentLower = content.toLowerCase()
    let score = 0

    positiveWords.forEach((word) => {
      if (contentLower.includes(word)) score += 1
    })
    negativeWords.forEach((word) => {
      if (contentLower.includes(word)) score -= 1
    })

    return Math.max(-1, Math.min(1, score / 10))
  }

  private assessTechnicalLevel(content: string): number {
    const technicalTerms = ["api", "ci/cd", "pipeline", "deployment", "blockchain", "algorithm", "automation"]
    const contentLower = content.toLowerCase()

    let count = 0
    technicalTerms.forEach((term) => {
      if (contentLower.includes(term)) count++
    })

    return Math.min(10, Math.max(1, count + 3))
  }
}

export class WebScrapingCollector extends DataCollector {
  async collect(config: AgentConfig): Promise<ProcessedContent[]> {
    const results: ProcessedContent[] = []

    console.log(`[v0] Web scraping for topic: ${config.role.focusTopic}`)

    if (config.dataSources.internet) {
      // Mock web scraping - in production, use proper web scraping tools
      await new Promise((resolve) => setTimeout(resolve, 800))

      const mockWebContent = [
        {
          url: "https://example-accounting-blog.com/ai-trends-2024",
          content: `The accounting industry is experiencing a digital transformation driven by artificial intelligence and machine learning technologies. Modern accounting firms are adopting AI-powered tools for automated data entry, expense categorization, and financial forecasting. These innovations are particularly beneficial for medium-sized firms serving family businesses, as they can provide enterprise-level capabilities without the associated costs.`,
          title: "AI Trends in Accounting 2024",
        },
        {
          url: "https://fintech-news.com/web3-accounting-revolution",
          content: `Web3 technologies are revolutionizing financial transparency and audit processes. Blockchain-based ledgers provide immutable records that enhance trust between businesses and their stakeholders. Smart contracts are automating many traditional accounting processes, reducing errors and increasing efficiency. This shift is helping educate the industry about the potential of decentralized finance.`,
          title: "Web3 Accounting Revolution",
        },
        {
          url: "https://devops-finance.com/ci-cd-fintech",
          content: `DevOps practices are becoming essential for financial software development. Continuous integration and deployment pipelines ensure that accounting applications can be updated safely and frequently. This is particularly important for CPA firms that rely on cloud-based solutions for their daily operations.`,
          title: "DevOps in Financial Technology",
        },
      ]

      for (const item of mockWebContent) {
        const relevanceScores = await this.calculateRelevanceScores(item.content, config)

        if (relevanceScores.overall > 0.4) {
          results.push({
            id: this.generateId(),
            source: `Web: ${item.url}`,
            timestamp: new Date(),
            rawContent: item.content,
            processedContent: `${item.title}\n\n${item.content}`,
            relevanceScores,
            metadata: {
              locationMentions: GeoProcessor.extractLocations(item.content),
              keyTopics: this.extractKeyTopics(item.content),
              sentiment: this.calculateSentiment(item.content),
              technicalLevel: this.assessTechnicalLevel(item.content),
            },
          })
        }
      }
    }

    console.log(`[v0] Collected ${results.length} web scraping items`)
    return results
  }

  private extractKeyTopics(content: string): string[] {
    const keywords = content
      .toLowerCase()
      .match(
        /\b(?:ai|artificial intelligence|machine learning|blockchain|web3|accounting|finance|devops|automation|fintech|digital transformation)\b/g,
      )
    return [...new Set(keywords || [])]
  }

  private calculateSentiment(content: string): number {
    const positiveWords = ["revolutionizing", "beneficial", "enhance", "efficiency", "innovation", "essential"]
    const negativeWords = ["challenging", "difficult", "problems", "issues", "concerns"]

    const contentLower = content.toLowerCase()
    let score = 0

    positiveWords.forEach((word) => {
      if (contentLower.includes(word)) score += 1
    })
    negativeWords.forEach((word) => {
      if (contentLower.includes(word)) score -= 1
    })

    return Math.max(-1, Math.min(1, score / 10))
  }

  private assessTechnicalLevel(content: string): number {
    const technicalTerms = [
      "api",
      "machine learning",
      "blockchain",
      "smart contracts",
      "ci/cd",
      "cloud-based",
      "automation",
      "algorithms",
    ]
    const contentLower = content.toLowerCase()

    let count = 0
    technicalTerms.forEach((term) => {
      if (contentLower.includes(term)) count++
    })

    return Math.min(10, Math.max(3, count + 2))
  }
}

export class DataCollectionPipeline {
  private collectors: DataCollector[]

  constructor() {
    this.collectors = [new RSSCollector(), new SocialMediaCollector(), new WebScrapingCollector()]
  }

  async collectAll(config: AgentConfig): Promise<ProcessedContent[]> {
    console.log(`[v0] Starting data collection pipeline`)
    const startTime = Date.now()

    const allResults: ProcessedContent[] = []

    // Collect from all sources in parallel
    const collectionPromises = this.collectors.map(async (collector) => {
      try {
        return await collector.collect(config)
      } catch (error) {
        console.log(`[v0] Collector failed:`, error)
        return []
      }
    })

    const results = await Promise.all(collectionPromises)
    results.forEach((result) => allResults.push(...result))

    // Sort by overall relevance
    allResults.sort((a, b) => b.relevanceScores.overall - a.relevanceScores.overall)

    const endTime = Date.now()
    console.log(`[v0] Data collection completed in ${endTime - startTime}ms`)
    console.log(`[v0] Collected ${allResults.length} total items`)

    return allResults
  }
}
