"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark)

    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle("dark", shouldBeDark)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle("dark", newIsDark)
    localStorage.setItem("theme", newIsDark ? "dark" : "light")
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="relative w-16 h-8 p-0 border border-border hover:bg-accent/20 transition-all duration-300"
    >
      <div className="relative w-full h-full flex items-center justify-between px-1">
        {/* Jedi Icon (Light Mode) */}
        <div className={`transition-all duration-300 ${isDark ? "opacity-30 scale-75" : "opacity-100 scale-100"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
            {/* Jedi silhouette with lightsaber */}
            <path
              d="M12 2C10.5 2 9.5 3 9.5 4.5V6H8.5C8 6 7.5 6.5 7.5 7V8.5C7.5 9 8 9.5 8.5 9.5H9.5V11H10.5V9.5H13.5V11H14.5V9.5H15.5C16 9.5 16.5 9 16.5 8.5V7C16.5 6.5 16 6 15.5 6H14.5V4.5C14.5 3 13.5 2 12 2Z"
              fill="currentColor"
            />
            {/* Lightsaber blade */}
            <rect x="11.5" y="11" width="1" height="10" fill="currentColor" className="animate-pulse" />
            <rect x="11" y="11" width="2" height="10" fill="currentColor" opacity="0.3" className="animate-pulse" />
          </svg>
        </div>

        {/* Darth Vader Icon (Dark Mode) */}
        <div className={`transition-all duration-300 ${isDark ? "opacity-100 scale-100" : "opacity-30 scale-75"}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary">
            {/* Vader helmet silhouette */}
            <path
              d="M12 2C8.5 2 6 4.5 6 8V10C6 10.5 6.5 11 7 11H8V12C8 13 9 14 10 14H14C15 14 16 13 16 12V11H17C17.5 11 18 10.5 18 10V8C18 4.5 15.5 2 12 2Z"
              fill="currentColor"
            />
            {/* Vader mask details */}
            <circle cx="10" cy="7" r="1" fill="currentColor" opacity="0.7" />
            <circle cx="14" cy="7" r="1" fill="currentColor" opacity="0.7" />
            <path d="M12 8.5V10.5" stroke="currentColor" strokeWidth="1" opacity="0.7" />
            {/* Red lightsaber blade */}
            <rect x="11.5" y="14" width="1" height="8" fill="#ef4444" className="animate-pulse" />
            <rect x="11" y="14" width="2" height="8" fill="#ef4444" opacity="0.3" className="animate-pulse" />
          </svg>
        </div>

        {/* Sliding indicator */}
        <div
          className={`absolute top-0.5 w-7 h-7 bg-primary/20 border border-primary rounded-sm transition-all duration-300 ${
            isDark ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </div>
    </Button>
  )
}
