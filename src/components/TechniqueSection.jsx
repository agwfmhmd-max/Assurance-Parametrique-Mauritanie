import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChevronRight, Database, Cpu, Gauge, Zap, Banknote, AlertTriangle, CheckCircle2 } from "lucide-react";
import { C, Card, SectionTitle, Reveal, RISK_COLORS, fmtNumber } from "./shared";

const ARCH_ICONS = [Database, Cpu, Gauge, Zap, Banknote];

/* Échelle risque en fonction du déficit pluviométrique (%) */
function riskFromDeficit(deficit) {
  if (deficit < 10) return { key: "normal", label: { fr: "Faible", ar: "منخفض" }, pct: 0 };
  if (deficit < 20) return { key: "vigilance", label: { fr: "Modéré", ar: "معتدل" }, pct: 25 };
  if (deficit < 35) return { key: "secheresse", label: { fr: "Élevé", ar: "مرتفع" }, pct: 50 };
  if (deficit < 50) return { key: "severe", label: { fr: "Sévère", ar: "حاد" }, pct: 75 };
  return { key: "critique", label: { fr: "Critique", ar: "حرج" }, pct: 100 };
}

export function TechniqueSection({ x, lang, dir }) {
  return (
    <section id="technique" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />

        {/* Diagramme d'architecture */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold mb-6" style={{ color: C.navy }}>{x.archTitle}</h3>
          <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-2">
            {x.arch.map((step, i) => {
              const Icon = ARCH_ICONS[i];
              return (
                <React.Fragment key={i}>
                  <div className="flex-1 rounded-xl border p-4 flex md:flex-col items-center md:items-start gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{ borderColor: C.border, background: `linear-gradient(160deg, ${C.ivory}, #FFFFFF)` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                      style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, border: `1px solid ${C.gold}44` }}>
                      <Icon size={18} color={C.goldLight} />
                    </div>
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.gold }}>{String(i + 1).padStart(2, "0")}</div>
                      <div className="text-sm font-semibold" style={{ color: C.navy }}>{step}</div>
                    </div>
                  </div>
                  {i < x.arch.length - 1 && (
                    <div className="hidden md:flex items-center"><ChevronRight size={18} style={{ color: C.gold }} className={dir === "rtl" ? "rotate-180" : ""} /></div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </Card>

        {/* Table des indices */}
        <Card>
          <h3 className="text-lg font-bold mb-4" style={{ color: C.navy }}>{x.indicesTitle}</h3>
          <div className="overflow-x-auto">
            <table className="tbl w-full text-xs md:text-sm min-w-[820px]">
              <thead>
                <tr style={{ backgroundColor: C.navy }}>
                  {x.indicesHead.map((h, i) => (
                    <th key={i} className="text-start px-3 py-3 font-semibold text-white first:rounded-s-lg last:rounded-e-lg">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {x.indices.map((row, i) => (
                  <tr key={i} className="border-b transition-colors hover:bg-black/[0.02]" style={{ borderColor: C.border }}>
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-3" style={{ color: j === 0 ? C.navy : C.slate, fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </section>
  );
}

/* Simulateur de déclenchement : mm observés vs seuil contractuel */
export function TriggerSimulator({ x, lang }) {
  const [observed, setObserved] = useState(185);
  const [threshold, setThreshold] = useState(250);
  const [capital, setCapital] = useState(100000);

  const deficit = useMemo(() => (threshold > 0 ? Math.max(0, ((threshold - observed) / threshold) * 100) : 0), [observed, threshold]);
  const risk = useMemo(() => riskFromDeficit(deficit), [deficit]);
  const triggered = deficit >= 10;
  const payout = useMemo(() => (triggered ? capital * (risk.pct / 100) : 0), [triggered, capital, risk]);

  const curve = useMemo(() => {
    const pts = [];
    for (let mm = 0; mm <= Math.max(400, threshold * 1.4); mm += 10) {
      const d = threshold > 0 ? Math.max(0, ((threshold - mm) / threshold) * 100) : 0;
      pts.push({ mm, payoutRate: d >= 10 ? riskFromDeficit(d).pct : 0 });
    }
    return pts;
  }, [threshold]);

  return (
    <section id="declenchement" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
      <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
      <div className="grid lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 h-fit">
          {[
            { label: x.observed, val: observed, set: setObserved, min: 0, max: 500, step: 5, unit: "mm" },
            { label: x.threshold, val: threshold, set: setThreshold, min: 50, max: 500, step: 5, unit: "mm" },
          ].map((p, i) => (
            <div key={i} className="mb-5">
              <div className="flex justify-between text-xs font-semibold mb-2.5" style={{ color: C.navy }}>
                <span>{p.label}</span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: C.blueSoft, color: C.blue }}>{p.val} {p.unit}</span>
              </div>
              <input type="range" min={p.min} max={p.max} step={p.step} value={p.val}
                onChange={(e) => p.set(Number(e.target.value))} className="w-full" style={{ "--val": `${((p.val - p.min) / (p.max - p.min)) * 100}%` }} />
            </div>
          ))}
          <div className="mb-2">
            <label className="text-xs font-semibold mb-2 block" style={{ color: C.navy }}>{x.capital}</label>
            <input type="number" value={capital} min={0} step={5000} onChange={(e) => setCapital(Number(e.target.value) || 0)}
              className="input-polished w-full border rounded-lg px-3 py-2.5 text-sm" style={{ borderColor: C.border, color: C.navy }} />
          </div>
          <p className="text-xs italic mt-4 pt-3 border-t flex items-start gap-2" style={{ color: C.slateLight, borderColor: C.border }}>
            {x.example}
          </p>
        </Card>

        <Card className="lg:col-span-3">
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}>
              <div className="text-xs mb-1" style={{ color: C.slateLight }}>{x.deficit}</div>
              <div className="font-bold text-xl" style={{ color: C.orange, fontFamily: "var(--font-display)" }}>{deficit.toFixed(0)} %</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}>
              <div className="text-xs mb-1" style={{ color: C.slateLight }}>{x.riskLevel}</div>
              <div className="font-bold text-xl flex items-center gap-2" style={{ color: RISK_COLORS[risk.key], fontFamily: "var(--font-display)" }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[risk.key] }} />
                {risk.label[lang] || risk.label.fr}
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: triggered ? C.redSoft : C.greenSoft, borderColor: `${triggered ? C.red : C.green}33` }}>
              <div className="text-xs mb-1" style={{ color: triggered ? C.red : C.green }}>{x.trigger}</div>
              <div className="font-bold text-base flex items-center gap-2" style={{ color: triggered ? C.red : C.green }}>
                {triggered ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
                {triggered ? x.yes : x.no}
              </div>
            </div>
            <div className="rounded-xl p-4 border" style={{ backgroundColor: C.blueSoft, borderColor: `${C.blue}22` }}>
              <div className="text-xs mb-1" style={{ color: C.blue }}>{x.payout}</div>
              <div className="font-bold text-xl" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{fmtNumber(payout, lang)} MRU</div>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curve} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="trigGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.red} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={C.red} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="mm" tick={{ fontSize: 10 }} unit=" mm" />
                <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v} %`} />
                <ReferenceLine x={observed} stroke={C.blue} strokeDasharray="4 4" />
                <ReferenceLine x={threshold} stroke={C.gold} strokeWidth={2} />
                <Area type="stepAfter" dataKey="payoutRate" stroke={C.red} fill="url(#trigGrad)" strokeWidth={2} name="%" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </section>
  );
}
