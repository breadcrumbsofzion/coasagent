"use client"

import { useEffect, useState } from "react"

export function OpeningFanfare() {
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    // Only play once per session
    if (!hasPlayed && typeof window !== "undefined") {
      const audio = new Audio("https://www.myinstants.com/media/sounds/20th-century-fox-fanfare.mp3")
      audio.volume = 0.3 // Lower volume for better UX
      audio.play().catch(console.error)
      setHasPlayed(true)
    }
  }, [hasPlayed])

  return null // This component doesn't render anything
}
