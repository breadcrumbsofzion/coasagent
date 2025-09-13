import { type NextRequest, NextResponse } from "next/server"
import { RSSFeedManager } from "@/lib/rss-generator"

// Global RSS feed manager instance
const rssManager = new RSSFeedManager()

export async function GET(request: NextRequest, { params }: { params: { format: string } }) {
  try {
    const format = params.format

    // Validate format
    const validFormats = ["normal", "question", "emoji", "quote", "info", "proverb", "csv", "json"]
    if (!validFormats.includes(format)) {
      return NextResponse.json({ error: "Invalid RSS format" }, { status: 400 })
    }

    // Get RSS feed XML
    const feedXML = rssManager.getFeedXML(format)

    if (!feedXML) {
      // Return empty feed if no content yet
      const emptyFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>COASAGENT - ${format.charAt(0).toUpperCase() + format.slice(1)} Mode</title>
    <description>No content generated yet. Start the agent to begin generating feeds.</description>
    <link>https://coasagent.example.com/rss/${format}</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>COASAGENT v1.0</generator>
  </channel>
</rss>`

      return new NextResponse(emptyFeed, {
        headers: {
          "Content-Type": "application/rss+xml; charset=utf-8",
          "Cache-Control": "public, max-age=300", // Cache for 5 minutes
        },
      })
    }

    return new NextResponse(feedXML, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300", // Cache for 5 minutes
      },
    })
  } catch (error) {
    console.error("Error generating RSS feed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Export the RSS manager for use by other parts of the application
export { rssManager }
