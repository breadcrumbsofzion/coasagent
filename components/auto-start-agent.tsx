"use client"

import { useEffect, useState } from "react"

export function AutoStartAgent() {
  const [hasAutoStarted, setHasAutoStarted] = useState(false)

  useEffect(() => {
    // Auto-start agent on page load if not already started
    if (!hasAutoStarted && typeof window !== "undefined") {
      const autoStart = async () => {
        try {
          const response = await fetch("/api/agent/auto-start", {
            method: "POST",
          })

          if (response.ok) {
            const data = await response.json()
            console.log("[v0] Auto-start result:", data.message)
          }
        } catch (error) {
          console.error("[v0] Auto-start failed:", error)
        }
      }

      // Delay auto-start by 3 seconds to let the page load
      setTimeout(autoStart, 3000)
      setHasAutoStarted(true)
    }
  }, [hasAutoStarted])

  return null // This component doesn't render anything
}
