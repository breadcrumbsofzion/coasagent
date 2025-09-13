export class GeoProcessor {
  // Haversine distance calculation
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Extract location mentions from text
  static extractLocations(text: string): string[] {
    // Simple location extraction - in production, use a proper NLP service
    const locationPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+([A-Z]{2})\b/g, // City, State
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+County\b/g, // County names
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:City|Town|Village)\b/g, // City/Town names
    ]

    const locations: string[] = []
    locationPatterns.forEach((pattern) => {
      const matches = text.match(pattern)
      if (matches) {
        locations.push(...matches)
      }
    })

    return [...new Set(locations)] // Remove duplicates
  }

  // Mock geocoding - in production, use Google Maps API
  static async geocodeLocation(location: string): Promise<{ lat: number; lon: number } | null> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Mock coordinates for common locations
    const mockCoordinates: Record<string, { lat: number; lon: number }> = {
      "New York": { lat: 40.7128, lon: -74.006 },
      "Los Angeles": { lat: 34.0522, lon: -118.2437 },
      Chicago: { lat: 41.8781, lon: -87.6298 },
      Houston: { lat: 29.7604, lon: -95.3698 },
      Phoenix: { lat: 33.4484, lon: -112.074 },
      Philadelphia: { lat: 39.9526, lon: -75.1652 },
      "San Antonio": { lat: 29.4241, lon: -98.4936 },
      "San Diego": { lat: 32.7157, lon: -117.1611 },
      Dallas: { lat: 32.7767, lon: -96.797 },
      "San Jose": { lat: 37.3382, lon: -121.8863 },
    }

    // Try to find a match
    for (const [city, coords] of Object.entries(mockCoordinates)) {
      if (location.toLowerCase().includes(city.toLowerCase())) {
        return coords
      }
    }

    // Return random coordinates if no match (for demo purposes)
    return {
      lat: 40 + Math.random() * 10, // Roughly US coordinates
      lon: -120 + Math.random() * 40,
    }
  }

  static async calculateRelevanceScore(
    content: string,
    focusPoint: string | null,
  ): Promise<{ geographic: number; locations: string[] }> {
    if (!focusPoint) {
      return { geographic: 0.3, locations: [] } // Global content gets lower priority
    }

    try {
      // Get focus point coordinates
      const focusCoords = await this.geocodeLocation(focusPoint)
      if (!focusCoords) {
        return { geographic: 0.3, locations: [] }
      }

      // Extract locations from content
      const locations = this.extractLocations(content)
      if (locations.length === 0) {
        return { geographic: 0.3, locations: [] }
      }

      // Calculate distances and find the closest
      let bestScore = 0
      for (const location of locations) {
        const coords = await this.geocodeLocation(location)
        if (coords) {
          const distance = this.calculateDistance(focusCoords.lat, focusCoords.lon, coords.lat, coords.lon)

          let score = 0
          if (distance <= 50)
            score = 1.0 // Within 50km: highest priority
          else if (distance <= 200)
            score = 0.8 // Within 200km: high priority
          else if (distance <= 420)
            score = 0.6 // Within 420km: medium priority
          else score = 0.3 // Global: lower priority

          bestScore = Math.max(bestScore, score)
        }
      }

      return { geographic: bestScore, locations }
    } catch (error) {
      console.log(`[v0] Error calculating geographic relevance:`, error)
      return { geographic: 0.3, locations: [] }
    }
  }
}
