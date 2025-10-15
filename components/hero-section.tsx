"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google: any;
  }
}

export function HeroSection() {
  const [address, setAddress] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    // Initialize Google Places Autocomplete
    let retryCount = 0;
    const maxRetries = 200; // wait up to 20s for slow networks/dev hot reloads

    // Ensure script tag exists in case RootLayout didn't render loader (SSR race)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const ensureMapsScript = () => {
      const existing = document.getElementById("google-maps-script");
      if (!existing && apiKey) {
        const s = document.createElement("script");
        s.id = "google-maps-script";
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
        s.async = true;
        s.defer = true;
        s.onload = () =>
          console.log("[Google Maps] Script injected and loaded");
        s.onerror = (e) => console.error("[Google Maps] Injection failed", e);
        document.head.appendChild(s);
      } else if (!existing && !apiKey) {
        console.error(
          "[Places API] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing; cannot load script"
        );
      }
    };

    const initAutocomplete = () => {
      retryCount++;

      const scriptPresent = document.getElementById("google-maps-script");
      if (!scriptPresent) ensureMapsScript();
      if (!window.google || !window.google.maps) {
        if (retryCount < maxRetries) {
          console.log(
            `[Places API] Waiting for Google Maps... (attempt ${retryCount})`
          );
          setTimeout(initAutocomplete, 100);
        } else {
          console.error(
            scriptPresent
              ? "[Places API] Google Maps failed to attach. Check console for script errors."
              : "[Places API] Google Maps script tag missing. Ensure GoogleMapsLoader is rendered and API key is set."
          );
        }
        return;
      }

      if (!window.google.maps.places) {
        if (retryCount < maxRetries) {
          console.log("[Places API] Places library pending... retrying");
          setTimeout(initAutocomplete, 100);
          return;
        }
        console.error(
          "[Places API] Places library not loaded. Check API key and enabled APIs."
        );
        return;
      }

      if (!inputRef.current) {
        console.warn("[Places API] Input ref not available");
        setTimeout(initAutocomplete, 100);
        return;
      }

      try {
        console.log("[Places API] Initializing autocomplete...");

        // Create autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["address"],
            componentRestrictions: { country: ["pl", "de", "fr", "us"] },
            fields: ["formatted_address", "geometry", "address_components"],
          }
        );

        autocompleteRef.current = autocomplete;
        console.log("[Places API] Autocomplete initialized successfully!");

        // Function to style pac-container
        const stylePacContainer = () => {
          const pacContainers = document.querySelectorAll(".pac-container");
          pacContainers.forEach((container) => {
            const htmlContainer = container as HTMLElement;

            // Use solid white background (light mode)
            htmlContainer.style.backgroundColor = "#ffffff";
            htmlContainer.style.border = "2px solid #e8e5e1";
            htmlContainer.style.borderRadius = "0.5rem";
            htmlContainer.style.boxShadow =
              "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)";
            htmlContainer.style.zIndex = "9999";
          });
        };

        // Watch for pac-container being added to DOM
        observerRef.current = new MutationObserver(() => {
          stylePacContainer();
        });

        observerRef.current.observe(document.body, {
          childList: true,
          subtree: true,
        });

        // Also add input event listener to style when user types
        if (inputRef.current) {
          inputRef.current.addEventListener("input", () => {
            setTimeout(stylePacContainer, 50);
          });
        }

        // Listen for place selection
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          console.log("[Places API] Place selected:", place);

          if (place.formatted_address) {
            setAddress(place.formatted_address);
          }
        });
      } catch (error) {
        console.error("[Places API] Error initializing autocomplete:", error);
      }
    };

    initAutocomplete();

    return () => {
      // Cleanup
      if (autocompleteRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(
          autocompleteRef.current
        );
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      router.push(`/roof-selection?address=${encodeURIComponent(address)}`);
    }
  };

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
        <div className="max-w-4xl mx-auto text-center">
          {/* Stats Badges */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center"></div>

          {/* Main Heading */}
          <h1 className="lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight text-balance text-5xl tracking-normal">
            Fotowoltaika z dotacją. Gotowa na inteligentne zarządzanie energią.
          </h1>

          {/* Updated subtitle */}
          <p className="text-primary-foreground/90 mb-8 leading-relaxed text-base">
            Składamy i rozliczamy Twój wniosek za Ciebie. Wszystkie nasze
            instalacje są kompatybilne z naszym nadchodzącym systemem HEMS — o
            50% bardziej efektywna instalacja.
          </p>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto"
          >
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Wpisz swój adres"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="h-14 pl-6 pr-14 rounded-lg text-lg bg-background border-2 border-input focus-visible:ring-primary"
                autoComplete="off"
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
              Wnioski robimy za Ciebie · Sprzęt HEMS-Ready · Integracje:
              falowniki X/Y/Z, magazyny A/B
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
