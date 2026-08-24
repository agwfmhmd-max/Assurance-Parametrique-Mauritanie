import React, { useState, useRef, useEffect } from "react";
import {
  Sprout, Beef, Shield, TrendingUp, Droplets, CloudRain, Sun, Wind,
  Layers, Gauge, BarChart3, Building2, Info,
} from "lucide-react";

/* ============================================================
   DESIGN TOKENS (partagés par toute la plateforme)
   ============================================================ */
export const C = {
  navy: "#0B1E39",
  navyDeep: "#060F1F",
  navyLight: "#132C52",
  blue: "#1B4E8C",
  blueLight: "#3B6FAE",
  blueSoft: "#EAF1FA",
  ivory: "#F6F7FA",
  white: "#FFFFFF",
  green: "#1E8A5F",
  greenSoft: "#E4F5EC",
  orange: "#C97A1F",
  orangeSoft: "#FBEEDD",
  red: "#B93A32",
  redSoft: "#FBEAE8",
  gold: "#B08A3E",
  goldLight: "#D9BC7A",
  ink: "#111827",
  slate: "#4B5563",
  slateLight: "#8792A2",
  border: "#E2E6ED",
};

export const RISK_COLORS = { normal: C.green, vigilance: "#D6A61A", secheresse: C.orange, severe: "#C4501F", critique: C.red };

export const RISK_LABELS_FR = { normal: "Normal", vigilance: "Vigilance", secheresse: "Sécheresse", severe: "Sévère", critique: "Critique" };
export const RISK_LABELS_AR = { normal: "عادي", vigilance: "يقظة", secheresse: "جفاف", severe: "حاد", critique: "حرج" };

export function riskFromIndex(idx) {
  if (idx >= 90) return { key: "normal", pct: 0 };
  if (idx >= 80) return { key: "vigilance", pct: 25 };
  if (idx >= 70) return { key: "secheresse", pct: 50 };
  if (idx >= 60) return { key: "severe", pct: 75 };
  return { key: "critique", pct: 100 };
}

export function fmtNumber(n, lang) {
  return new Intl.NumberFormat(lang === "ar" ? "ar-MR" : "fr-FR").format(Math.round(n));
}

/* ============================================================
   SCROLL REVEAL — observateur partagé
   ============================================================ */
let rvObserver = null;
function getRvObserver() {
  if (typeof window === "undefined") return null;
  if (!rvObserver) {
    rvObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("rv-in");
          rvObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
  }
  return rvObserver;
}
function useReveal(ref) {
  useEffect(() => {
    const el = ref.current;
    const obs = getRvObserver();
    if (el && obs) {
      obs.observe(el);
      return () => obs.unobserve(el);
    }
  }, []);
}
export const Reveal = ({ children, className = "", style }) => {
  const ref = useRef(null);
  useReveal(ref);
  return <div ref={ref} className={`rv ${className}`} style={style}>{children}</div>;
};

/* Compteur animé */
export function AnimatedNumber({ value, format, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(value * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, duration]);
  return <span ref={ref}>{format ? format(display) : Math.round(display)}</span>;
}

/* ============================================================
   PRIMITIVES UI
   ============================================================ */
export const Eyebrow = ({ children, light = false }) => (
  <div className="inline-flex items-center gap-2.5 text-[11px] font-bold tracking-[0.18em] uppercase mb-4" style={{ color: light ? C.goldLight : C.blue }}>
    <span className="w-7 h-[2px] rounded-full" style={{ background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />
    {children}
  </div>
);

export const SectionTitle = ({ eyebrow, title, desc, light = false }) => (
  <Reveal className="max-w-3xl mb-10 md:mb-12">
    {eyebrow && <Eyebrow light={light}>{eyebrow}</Eyebrow>}
    <h2 className="text-3xl md:text-[2.6rem] md:leading-[1.15] font-bold mb-4" style={{ color: light ? C.white : C.navy, fontFamily: "var(--font-display)" }}>{title}</h2>
    {desc && <p className="text-base md:text-lg leading-relaxed" style={{ color: light ? "#A9BBD4" : C.slate }}>{desc}</p>}
  </Reveal>
);

export const SimBadge = ({ text }) => (
  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border shadow-sm"
    style={{ color: C.orange, borderColor: `${C.orange}55`, backgroundColor: C.orangeSoft }}>
    <Info size={12} /> {text}
  </span>
);

export const RiskDot = ({ level }) => (
  <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[level] }} />
);

export const Card = ({ children, className = "", style, ...props }) => {
  const ref = useRef(null);
  useReveal(ref);
  return (
    <div
      ref={ref}
      {...props}
      className={`rv card-lift bg-white rounded-2xl border p-6 shadow-[0_1px_2px_rgba(11,30,57,0.05),0_10px_28px_-18px_rgba(11,30,57,0.14)] ${className}`}
      style={{ borderColor: C.border, ...style }}
    >
      {children}
    </div>
  );
};

export function Tip({ text, children }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1 cursor-help" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(o => !o)}>
      {children}
      <Info size={13} style={{ color: C.slateLight }} />
      {open && (
        <span className="absolute z-30 top-full mt-2 start-0 w-64 text-xs font-normal leading-relaxed p-3 rounded-lg shadow-lg text-white"
          style={{ backgroundColor: C.navy }}>
          {text}
        </span>
      )}
    </span>
  );
}

export const ICONS = {
  sprout: Sprout, beef: Beef, shield: Shield, coin: TrendingUp, drop: Droplets, cloud: CloudRain,
  sun: Sun, wind: Wind, layers: Layers, gauge: Gauge, chart: BarChart3, building: Building2,
};

/* Badge de qualification des données : réel / hypothèse / estimation / simulation */
export const BADGE_STYLES = {
  reel: { color: C.green, bg: C.greenSoft, border: `${C.green}44` },
  hypothese: { color: C.orange, bg: C.orangeSoft, border: `${C.orange}44` },
  estimation: { color: C.blue, bg: C.blueSoft, border: `${C.blue}44` },
  simulation: { color: C.gold, bg: "#F7F0E0", border: `${C.gold}44` },
};
export const DataBadge = ({ type, labels }) => {
  const s = BADGE_STYLES[type] || BADGE_STYLES.simulation;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
      style={{ color: s.color, backgroundColor: s.bg, borderColor: s.border }}>
      {labels[type] || type}
    </span>
  );
};
