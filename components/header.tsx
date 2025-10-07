"use client"

import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import Link from "next/link"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">
              OTOVO<span className="text-primary">☀</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div className="relative group">
              <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm font-medium">
                Rozwiązania
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
              Ceny i gwarancja
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
              O nas
            </Link>
          </nav>

          {/* CTA and Contact */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm"></div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                Rozwiązania
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                Ceny i gwarancja
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground text-sm font-medium">
                O nas
              </Link>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Zadzwoń: 22 307 35 68</p>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
