"use client";

import Script from "next/script";

export function GoogleMapsLoader() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    if (typeof window !== "undefined") {
      // Helpful diagnostic in the browser if env is missing
      // eslint-disable-next-line no-console
      console.error(
        "[Google Maps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set. The Places script will not load."
      );
    }
    return null;
  }

  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`}
      strategy="afterInteractive"
      id="google-maps-script"
      onLoad={() => {
        console.log("[Google Maps] Script loaded successfully");
      }}
      onError={(e) => {
        console.error("[Google Maps] Script failed to load:", e);
      }}
    />
  );
}
