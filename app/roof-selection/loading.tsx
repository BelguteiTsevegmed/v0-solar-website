import { SystemEmojiGlobeScanner } from "@/components/system-emoji-globe-scanner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <SystemEmojiGlobeScanner
          size={80}
          variant="europeAfrica"
          className="mx-auto"
        />
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          Szukamy twojego dachu...
        </h1>
      </div>
    </div>
  );
}
