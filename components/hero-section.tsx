"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { Search } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function HeroSection() {
  const [address, setAddress] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (address.trim()) {
      router.push(`/roof-search?address=${encodeURIComponent(address)}`)
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-secondary to-background pt-16">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/solar-panels-on-house-roof-with-trees-in-backgroun.jpg"
          alt="Solar panels on roof"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          {/* Stats Badges */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center"></div>

          {/* Main Heading */}
          <h1 className="lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight text-balance text-5xl tracking-normal leading-5">
            Fotowoltaika z dotacją. Gotowa na inteligentne zarządzanie energią.
          </h1>

          {/* Updated subtitle */}
          <p className="text-primary-foreground/90 mb-8 leading-relaxed text-base">
            Składamy i rozliczamy Twój wniosek za Ciebie. Wszystkie nasze instalacje są kompatybilne z nadchodzącym
            systemem HEMS — bez wymiany sprzętu.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Wpisz swój adres"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-14 pl-6 pr-14 rounded-lg text-lg bg-background border-2 border-input focus-visible:ring-primary"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>

          <div className="mt-8 bg-primary-foreground/10 backdrop-blur-md rounded-lg px-6 py-4 border border-primary-foreground/20 max-w-2xl mx-auto">
            <p className="text-primary-foreground text-sm leading-relaxed">
              Wnioski robimy za Ciebie · Sprzęt HEMS-Ready · Integracje: falowniki X/Y/Z, magazyny A/B
            </p>
          </div>

          {/* Google Rating */}
        </div>
      </div>
    </section>
  )
}
