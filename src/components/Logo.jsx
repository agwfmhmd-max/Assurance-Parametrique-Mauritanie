import React from "react";

/* ============================================================
   LOGO — APC Mauritanie
   Bouclier (assurance/protection) + goutte de pluie (risque
   climatique) + feuille (agriculture) + corne discrète (élevage)
   + barres de données (finance) + croissant (Mauritanie).
   Variantes : "dark" (fond sombre), "light" (fond clair),
   "compact" (icône seule), "full" (icône + nom).
   ============================================================ */

export function LogoMark({ size = 36, theme = "dark", id = "lm" }) {
  const navy = theme === "dark" ? "#0B1E39" : "#FFFFFF";
  const gold = "#D9BC7A";
  const goldDeep = "#B08A3E";
  const blue = theme === "dark" ? "#5B9BD5" : "#1B4E8C";
  const green = theme === "dark" ? "#3FBF8A" : "#1E8A5F";
  const stroke = theme === "dark" ? "rgba(255,255,255,0.9)" : "#0B1E39";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-shield`} x1="10" y1="4" x2="54" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#132C52" />
          <stop offset="1" stopColor="#060F1F" />
        </linearGradient>
        <linearGradient id={`${id}-drop`} x1="32" y1="14" x2="32" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={blue} stopOpacity="0.95" />
          <stop offset="1" stopColor={blue} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {/* Bouclier */}
      <path
        d="M32 3 L54 11 V30 C54 45 44.5 55.5 32 60 C19.5 55.5 10 45 10 30 V11 Z"
        fill={theme === "light" ? "url(#" + id + "-shield)" : "url(#" + id + "-shield)"}
        stroke={goldDeep}
        strokeWidth="1.6"
      />
      {/* Croissant — Mauritanie */}
      <path
        d="M41.5 12.5 A7.5 7.5 0 1 0 41.5 24 A6 6 0 1 1 41.5 12.5 Z"
        fill={gold}
        opacity="0.95"
      />
      {/* Goutte de pluie */}
      <path
        d="M26 18 C26 18 20.5 26 20.5 30 A5.5 5.5 0 0 0 31.5 30 C31.5 26 26 18 26 18 Z"
        fill={`url(#${id}-drop)`}
      />
      {/* Feuille / culture */}
      <path
        d="M34 30 C34 24 38 20.5 44 20 C43.6 26.5 40 30.2 34 30 Z"
        fill={green}
      />
      <path d="M34 30 C37 27 40 24.5 43 22.5" stroke={navy} strokeWidth="0.8" opacity="0.35" fill="none" />
      {/* Corne discrète — élevage */}
      <path
        d="M22 44 C20 40 21 36.5 24.5 35 C22.5 38.5 23 41 25.5 43 Z"
        fill={gold}
        opacity="0.9"
      />
      {/* Barres de données — finance */}
      <g>
        <rect x="28" y="42" width="3.6" height="8" rx="1" fill={blue} />
        <rect x="33.6" y="38.5" width="3.6" height="11.5" rx="1" fill={gold} />
        <rect x="39.2" y="34.5" width="3.6" height="15.5" rx="1" fill={green} />
        <path d="M27 39 L36 33.5 L43.5 29.5" stroke={stroke} strokeWidth="1.1" opacity="0.55" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

export default function Logo({ variant = "full", theme = "dark", size = 38, subtitle, dir = "ltr" }) {
  if (variant === "compact") return <LogoMark size={size} theme={theme} id="compact" />;
  const isDark = theme === "dark";
  return (
    <span className="inline-flex items-center gap-2.5 select-none" dir={dir}>
      <LogoMark size={size} theme={isDark ? "dark" : "light"} id={isDark ? "full-dark" : "full-light"} />
      <span className="flex flex-col leading-none">
        <span
          className="font-extrabold tracking-tight whitespace-nowrap"
          style={{ color: isDark ? "#FFFFFF" : "#0B1E39", fontSize: size * 0.34 }}
        >
          APC · Mauritanie
        </span>
        {subtitle && (
          <span
            className="font-semibold uppercase mt-1 whitespace-nowrap"
            style={{ color: "#B08A3E", fontSize: size * 0.24, letterSpacing: "0.14em" }}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
