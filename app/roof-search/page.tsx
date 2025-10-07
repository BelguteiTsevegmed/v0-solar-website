"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function RoofSearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const address = searchParams.get("address")

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(`/roof-selection?address=${encodeURIComponent(address || "")}`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [router, address])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Szukamy twojego dachu...</h1>
          <div className="flex justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          {address && <p className="text-muted-foreground text-lg mt-4">{address}</p>}
        </div>
      </div>
    </div>
  )
}
