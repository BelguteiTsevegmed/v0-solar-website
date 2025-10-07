import type React from "react"
import { GoogleMapsLoader } from "@/components/google-maps-loader"

export default function RoofSelectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleMapsLoader />
      {children}
    </>
  )
}
