"use client"

import { useState, useEffect } from "react"
import { MapPin, Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface InteractiveMapProps {
  value: string
  onChange: (value: string) => void
}

interface LocationSuggestion {
  display_name: string
  lat: string
  lon: string
}

export function InteractiveMap({ value, onChange }: InteractiveMapProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null)

  useEffect(() => {
    if (value && value.includes(",")) {
      const [lat, lon] = value.split(",").map((s) => Number.parseFloat(s.trim()))
      if (!isNaN(lat) && !isNaN(lon)) {
        setSelectedCoords({ lat, lon })
      }
    }
  }, [value])

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
      )
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error("Failed to search locations:", error)
      setSuggestions([])
    }
  }

  const selectLocation = (suggestion: LocationSuggestion) => {
    const coords = { lat: Number.parseFloat(suggestion.lat), lon: Number.parseFloat(suggestion.lon) }
    setSelectedCoords(coords)
    onChange(`${coords.lat}, ${coords.lon}`)
    setSearchQuery(suggestion.display_name)
    setSuggestions([])
    setIsSearching(false)
  }

  const clearLocation = () => {
    setSelectedCoords(null)
    setSearchQuery("")
    onChange("")
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchLocations(e.target.value)
            }}
            onFocus={() => setIsSearching(true)}
            className="pr-10"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {selectedCoords && (
          <Button variant="outline" size="sm" onClick={clearLocation}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isSearching && suggestions.length > 0 && (
        <Card className="absolute z-10 w-full max-w-md">
          <CardContent className="p-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectLocation(suggestion)}
                className="w-full text-left p-2 hover:bg-muted rounded text-sm"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="truncate">{suggestion.display_name}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedCoords && (
        <Card className="mt-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Selected Location</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCoords.lat.toFixed(4)}, {selectedCoords.lon.toFixed(4)}
                  </div>
                </div>
              </div>
              <div className="w-16 h-16 bg-muted rounded border-2 border-primary flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
