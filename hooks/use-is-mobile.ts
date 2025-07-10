"use client"

import { useState, useEffect } from "react"

export function useIsMobile(query = "(max-width: 768px)") {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Set initial state
    setIsMobile(mediaQuery.matches)

    // Add listener for changes
    mediaQuery.addEventListener("change", handleChange)

    // Cleanup listener on component unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange)
    }
  }, [query])

  return isMobile
}
