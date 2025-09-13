import { NextResponse } from "next/server"
import { rssManager } from "../[format]/route"

export async function GET() {
  try {
    const latestItems = rssManager.getLatestItems(20)
    const stats = rssManager.getFeedStats()

    return NextResponse.json({
      latestItems: latestItems.map((item) => ({
        format: item.format,
        title: item.item.title,
        content: item.item.content.substring(0, 200) + "...", // Truncate for preview
        pubDate: item.item.pubDate,
        category: item.item.category,
      })),
      stats,
      availableFormats: rssManager.getAllFormats(),
    })
  } catch (error) {
    console.error("Error getting latest RSS items:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
