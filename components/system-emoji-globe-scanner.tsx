import React from "react";

/**
 * SystemEmojiGlobeScanner – fixed globe using the user's **system emoji font**
 * with a scanning magnifying glass (emoji). No rotation – only X/Y translation.
 *
 * Zero licensing friction: uses plain emoji characters (🌍/🌎/🌏 and 🔎/🔍).
 */

interface SystemEmojiGlobeScannerProps {
  size?: number;
  label?: string;
  variant?: "americas" | "europeAfrica" | "asiaAustralia";
  xRange?: number;
  yRange?: number;
  xSpeed?: string;
  ySpeed?: string;
  glass?: string;
  glassScale?: number;
  className?: string;
}

export function SystemEmojiGlobeScanner({
  size = 72, // globe emoji font-size in px
  label = "Loading…",
  // Choose which globe to show: "americas" (🌎), "europeAfrica" (🌍), or "asiaAustralia" (🌏)
  variant = "europeAfrica",
  // Scan motion controls (no rotation)
  xRange = 0.45, // fraction of globe radius to travel horizontally (0..1)
  yRange = 0.28, // fraction of globe radius to travel vertically (0..1)
  xSpeed = "1.8s", // duration for X sweep
  ySpeed = "2.4s", // duration for Y sweep (different for organic motion)
  glass = "🔎", // magnifier emoji (🔎 or 🔍)
  glassScale = 0.42, // magnifier size relative to globe
  className = "",
}: SystemEmojiGlobeScannerProps) {
  const globeEmoji =
    variant === "americas" ? "🌎" : variant === "asiaAustralia" ? "🌏" : "🌍";

  const globePx = typeof size === "number" ? size : parseInt(size, 10) || 72;
  const r = globePx / 2;
  const dx = Math.max(0, Math.min(1, xRange)) * r; // horizontal travel from center
  const dy = Math.max(0, Math.min(1, yRange)) * r; // vertical travel from center
  const glassPx = Math.round(globePx * glassScale);

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: globePx, height: globePx }}
      role="img"
      aria-label={label}
      title={label}
    >
      <style>{`
        /* Independent X and Y scans (no rotation used anywhere) */
        @keyframes scanX {
          0%, 100% { transform: translateX(calc(var(--dx) * -1)); }
          50%      { transform: translateX(var(--dx)); }
        }
        @keyframes scanY {
          0%, 100% { transform: translateY(calc(var(--dy) * -1)); }
          50%      { transform: translateY(var(--dy)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .reduce-motion { animation: none !important; }
        }
      `}</style>

      {/* Fixed globe emoji (no spin) */}
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          fontSize: `${globePx}px`,
          lineHeight: 1,
          textAlign: "center",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        {globeEmoji}
      </span>

      {/* Scanner glass – translate X and Y independently (no rotation) */}
      <div
        className="absolute left-1/2 top-1/2" // anchor at center
        style={{ transform: "translate(-50%, -50%)" }}
        aria-hidden
      >
        <div
          className="reduce-motion"
          style={{
            animation: `scanX ${xSpeed} ease-in-out infinite`,
            ["--dx" as any]: `${dx}px`,
          }}
        >
          <div
            className="reduce-motion"
            style={{
              animation: `scanY ${ySpeed} ease-in-out infinite`,
              ["--dy" as any]: `${dy}px`,
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                transform: "translate(-50%, -50%)",
                fontSize: `${glassPx}px`,
                lineHeight: 1,
                filter: "drop-shadow(0 1px 0.5px rgba(0,0,0,0.25))",
                userSelect: "none",
              }}
              title={label}
            >
              {glass}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
