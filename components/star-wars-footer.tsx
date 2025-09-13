"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function StarWarsFooter() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const playSound = (soundFile: string) => {
    const audio = new Audio(soundFile)
    audio.play().catch(console.error)
  }

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <footer className="mt-16 border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <button
            onClick={() => playSound(isDark ? "https://www.myinstants.com/media/sounds/i-am-your-father_rCXrfcX.mp3" : "https://www.myinstants.com/media/sounds/lightsaber_02_eqldEHr.mp3")}
            className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 cursor-pointer border-none bg-transparent"
          >
            {isDark ? "Don't turn to the dark side" : "Do. Or do not. There is no try."}
          </button>
          <div className="mt-4 text-xs text-muted-foreground/60">
            COASAGENT © 2024 - May the Force be with your data
          </div>
        </div>
      </div>
    </footer>
  )
}
