"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Copy, ExternalLink, RefreshCw } from "lucide-react"

interface RSSItem {
  format: string
  title: string
  content: string
  pubDate: string
  category: string
}

interface RSSStats {
  [format: string]: {
    itemCount: number
    lastUpdated: string | null
  }
}

interface RSSDisplayProps {
  selectedFormat: string
  agentStatus: "running" | "stopped" | "error"
}

export function RSSDisplay({ selectedFormat, agentStatus }: RSSDisplayProps) {
  const [latestItems, setLatestItems] = useState<RSSItem[]>([])
  const [stats, setStats] = useState<RSSStats>({})
  const [currentFeedXML, setCurrentFeedXML] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchLatestItems = async () => {
    try {
      const response = await fetch("/api/rss/latest")
      if (response.ok) {
        const data = await response.json()
        setLatestItems(data.latestItems || [])
        setStats(data.stats || {})
      }
    } catch (error) {
      console.error("Failed to fetch latest RSS items:", error)
    }
  }

  const fetchCurrentFeed = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/rss/${selectedFormat}`)
      if (response.ok) {
        const xml = await response.text()
        setCurrentFeedXML(xml)
      }
    } catch (error) {
      console.error("Failed to fetch RSS feed:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyRSSFeed = () => {
    navigator.clipboard.writeText(currentFeedXML)
  }

  const copyRSSURL = () => {
    const url = `${window.location.origin}/api/rss/${selectedFormat}`
    navigator.clipboard.writeText(url)
  }

  useEffect(() => {
    fetchLatestItems()
    fetchCurrentFeed()

    // Auto-refresh when agent is running
    let interval: NodeJS.Timeout | null = null
    if (agentStatus === "running") {
      interval = setInterval(() => {
        fetchLatestItems()
        fetchCurrentFeed()
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [selectedFormat, agentStatus])

  const filteredItems = latestItems.filter((item) => item.format === selectedFormat)

  return (
    <div className="space-y-6">
      {/* RSS Feed Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            RSS Feed Statistics
            <Button variant="outline" size="sm" onClick={fetchLatestItems} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats).map(([format, stat]) => (
              <div key={format} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.itemCount}</div>
                <div className="text-sm text-muted-foreground capitalize">{format}</div>
                {stat.lastUpdated && (
                  <div className="text-xs text-muted-foreground">{new Date(stat.lastUpdated).toLocaleTimeString()}</div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Format Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="capitalize">{selectedFormat} RSS Feed</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyRSSURL}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Copy URL
              </Button>
              <Button variant="outline" size="sm" onClick={copyRSSFeed} disabled={!currentFeedXML}>
                <Copy className="h-4 w-4 mr-2" />
                Copy XML
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            RSS feed URL: <code className="text-xs">/api/rss/{selectedFormat}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={currentFeedXML || "No RSS content generated yet. Start the agent to begin generating feeds."}
            readOnly
            rows={15}
            className="font-mono text-xs"
          />
        </CardContent>
      </Card>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Items ({selectedFormat})</CardTitle>
          <CardDescription>Latest generated content for this format</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No items generated yet for {selectedFormat} format.
            </p>
          ) : (
            <div className="space-y-4">
              {filteredItems.slice(0, 5).map((item, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{item.title}</h4>
                    <Badge variant="secondary">{item.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{new Date(item.pubDate).toLocaleString()}</p>
                  <div className="text-sm bg-muted p-3 rounded max-h-32 overflow-y-auto">
                    {item.content.length > 300 ? `${item.content.substring(0, 300)}...` : item.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
