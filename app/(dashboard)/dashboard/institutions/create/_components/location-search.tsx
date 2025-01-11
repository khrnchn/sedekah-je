"use client"

import { Input } from "@/components/ui/input"
import { FormControl, FormItem, FormLabel } from "@/components/ui/form"
import { useMemo, useRef } from "react"
import { useLoadScript } from "@react-google-maps/api"

interface LocationSearchProps {
  onLocationSelect: (lat: number, lng: number, address: string, postcode: string) => void
}

export function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places"],
  })

  const searchBox = useMemo(() => {
    if (!isLoaded || !inputRef.current) return null

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      componentRestrictions: { country: "MY" }, // Restrict to Malaysia
    })

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const address = place.formatted_address || ""

        let postcode = ""
        place.address_components?.forEach((component) => {
          if (component.types.includes("postal_code")) {
            postcode = component.long_name
          }
        })

        onLocationSelect(lat, lng, address, postcode)
      }
    })

    return autocomplete
  }, [isLoaded, onLocationSelect])

  if (!isLoaded) return <div>Loading...</div>

  return (
    <FormItem>
      <FormLabel>Location</FormLabel>
      <FormControl>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search for a masjid or surau in Malaysia..."
          className="w-full"
        />
      </FormControl>
    </FormItem>
  )
}