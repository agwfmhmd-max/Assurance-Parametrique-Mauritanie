import React, { useMemo } from "react";
import { C, Card, SectionTitle, DataBadge, AnimatedNumber, Tip } from "./shared";
import { projectYears, breakEven, roi, fmtMRU, fmtCompact } from "../finance/engine";

export default function KpiDashboard({ x, badges, lang, assumptions }) {
  const rows = useMemo(() => projectYears(assumptions), [assumptions]);
  const be = useMemo(() => breakEven(assumptions), [assumptions]);
  const roiCentral = useMemo(() => roi(rows, assumptions.initialInvestment), [rows, assumptions]);
  const net5 = rows.reduce((s, r) => s + r.resultNet, 0);
  const avgLossRatio = rows.reduce((s, r) => s + r.lossRatio, 0) / rows.length;

  const values = {
    market: { v: 120000, fmt: (v) => fmtCompact(v, lang) },
    farmers: { v: 70000, fmt: (v) => fmtCompact(v, lang) },
    herders: { v: 50000, fmt: (v) => fmtCompact(v, lang) },
    premium: { v: assumptions.premiumAvg, fmt: (v) => `${fmtCompact(v, lang)} MRU` },
    indemnity: { v: assumptions.indemnityAvg, fmt: (v) => `${fmtCompact(v, lang)} MRU` },
    lossRatio: { v: avgLossRatio, fmt: (v) => `${v.toFixed(1)} %` },
    frequency: { v: assumptions.claimFreq, fmt: (v) => `${v.toFixed(0)} %` },
    econLoss: { v: rows[0].indemnities, fmt: (v) => `${fmtCompact(v, lang)} MRU` },
    viability: { v: null, text: net5 > 0 ? (lang === "ar" ? "إيجابية" : "Positive") : (lang === "ar" ? "للتعزيز" : "À renforcer"), color: net5 > 0 ? C.green : C.orange },
    roi: { v: roiCentral, fmt: (v) => `${v.toFixed(1)} %` },
    breakeven: { v: be.viable ? be.insuredMin : 0, fmt: (v) => (be.viable ? fmtCompact(v, lang) : "—") },
  };

  return (
    <section id="dashboard" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {x.kpis.map((k) => {
            const val = values[k.key];
            if (!val) return null;
            return (
              <Card key={k.key} className="!p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <DataBadge type={k.type} labels={badges} />
                </div>
                <div className="text-2xl md:text-[1.7rem] font-bold leading-tight mb-1.5" style={{ color: val.color || C.navy, fontFamily: "var(--font-display)" }}>
                  {val.text ? val.text : <AnimatedNumber value={val.v} format={val.fmt} />}
                </div>
                <div className="text-xs font-medium leading-snug" style={{ color: C.slate }}>
                  <Tip text={k.tip}><span>{k.label}</span></Tip>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
