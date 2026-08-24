import React, { useMemo } from "react";
import { ArrowUpRight, BarChart3, Database, Info, MapPinned, ShieldCheck, Sprout, Beef } from "lucide-react";
import { C, Card, SectionTitle, DataBadge, AnimatedNumber, Tip } from "./shared";
import { projectYears, breakEven, roi, npv, fmtCompact } from "../finance/engine";

const unavailable = (lang) => lang === "ar" ? "البيانات غير متاحة" : "Donnée non disponible";

export default function KpiDashboard({ x, badges, lang, assumptions }) {
  const rows = useMemo(() => projectYears(assumptions), [assumptions]);
  const be = useMemo(() => breakEven(assumptions), [assumptions]);
  const roiCentral = useMemo(() => roi(rows, assumptions.initialInvestment), [rows, assumptions]);
  const npvCentral = useMemo(() => npv(assumptions, rows), [assumptions, rows]);
  const net5 = rows.reduce((s, r) => s + r.resultNet, 0);
  const avgLossRatio = rows.length ? rows.reduce((s, r) => s + r.lossRatio, 0) / rows.length : 0;
  const fmt = (v) => fmtCompact(v, lang);
  const na = unavailable(lang);
  const status = net5 > 0 ? (lang === "ar" ? "قابلة للاستمرار وفق الفرضيات" : "Favorable sous hypothèses") : (lang === "ar" ? "تحتاج إلى تعزيز" : "À renforcer");

  const values = {
    market: { text: na, color: C.slateLight },
    farmers: { text: na, color: C.slateLight },
    herders: { text: na, color: C.slateLight },
    premium: { v: assumptions.premiumAvg, fmt: (v) => `${fmt(v)} MRU` },
    indemnity: { v: assumptions.indemnityAvg, fmt: (v) => `${fmt(v)} MRU` },
    lossRatio: { v: avgLossRatio, fmt: (v) => `${v.toFixed(1)} %` },
    frequency: { v: assumptions.claimFreq, fmt: (v) => `${v.toFixed(1)} %` },
    econLoss: { v: rows[0]?.indemnities || 0, fmt: (v) => `${fmt(v)} MRU` },
    viability: { text: status, color: net5 > 0 ? C.green : C.orange },
    roi: { v: roiCentral, fmt: (v) => `${v.toFixed(1)} %` },
    breakeven: { text: be.viable ? fmt(be.insuredMin) : na, color: be.viable ? C.navy : C.orange },
  };

  const secondary = [
    { icon: Database, label: lang === "ar" ? "الفرضيات النشطة" : "Hypothèses actives", value: Object.keys(assumptions).length, tone: C.blue, note: lang === "ar" ? "من نموذج البيانات الحالي" : "Issues du modèle actuel" },
    { icon: BarChart3, label: lang === "ar" ? "السيناريوهات" : "Scénarios", value: 3, tone: C.gold, note: lang === "ar" ? "متشائم · مركزي · متفائل" : "Pessimiste · central · optimiste" },
    { icon: MapPinned, label: lang === "ar" ? "المناطق المعروضة" : "Zones affichées", value: 7, tone: C.green, note: lang === "ar" ? "مخطط توضيحي قابل للاستبدال" : "Schéma illustratif à remplacer par des données" },
    { icon: ShieldCheck, label: lang === "ar" ? "VAN / NPV" : "VAN / NPV", value: Number.isFinite(npvCentral) ? `${fmt(npvCentral)} MRU` : na, tone: npvCentral >= 0 ? C.green : C.orange, note: lang === "ar" ? "من التدفقات الحالية" : "Sur les flux actuels" },
  ];

  return (
    <section id="dashboard" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between gap-6 flex-wrap mb-7">
          <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
          <div className="rounded-2xl border px-4 py-3 min-w-[220px]" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyLight})`, borderColor: `${C.gold}55`, color: C.white }}>
            <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-1" style={{ color: C.goldLight }}>{lang === "ar" ? "حالة الدراسة" : "État de l'étude"}</div>
            <div className="font-bold text-sm flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: C.goldLight }} />{status}</div>
            <div className="text-[11px] mt-1" style={{ color: "#A9BBD4" }}>{lang === "ar" ? "آخر تحديث: من بيانات الجلسة الحالية" : "Dernière mise à jour : session actuelle"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {secondary.map(({ icon: Icon, label, value, tone, note }) => (
            <Card key={label} className="!p-4 border-l-4" style={{ borderInlineStartColor: tone }}>
              <div className="flex items-start justify-between gap-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${tone}18`, color: tone }}><Icon size={17} /></div><ArrowUpRight size={15} style={{ color: C.slateLight }} /></div>
              <div className="font-bold text-xl mt-4" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{value}</div>
              <div className="text-xs font-semibold mt-1" style={{ color: C.slate }}>{label}</div>
              <div className="text-[10px] mt-1 leading-relaxed" style={{ color: C.slateLight }}>{note}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {x.kpis.map((k) => {
            const val = values[k.key];
            if (!val) return null;
            return (
              <Card key={k.key} className="!p-5 card-lift">
                <div className="flex items-start justify-between gap-2 mb-3"><DataBadge type={k.type} labels={badges} /><Tip text={k.tip}><Info size={14} style={{ color: C.slateLight }} /></Tip></div>
                <div className="text-xl md:text-[1.55rem] font-bold leading-tight mb-1.5 break-words" style={{ color: val.color || C.navy, fontFamily: "var(--font-display)" }}>
                  {val.text ? val.text : <AnimatedNumber value={val.v} format={val.fmt} />}
                </div>
                <div className="text-xs font-medium leading-snug" style={{ color: C.slate }}>{k.label}</div>
                {val.text === na && <div className="mt-3 text-[10px] leading-relaxed" style={{ color: C.slateLight }}>{lang === "ar" ? "أضف مصدر بيانات موثقًا من لوحة المشرف." : "Ajoutez une source documentée depuis l'espace superviseur."}</div>}
              </Card>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-5">
          <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: C.greenSoft, borderColor: `${C.green}33` }}><Sprout size={18} style={{ color: C.green }} /><p className="text-xs leading-relaxed" style={{ color: C.navy }}>{lang === "ar" ? "النتائج المالية محسوبة مباشرة من الفرضيات الحالية، وليست توقعات سوقية مستقلة." : "Les résultats financiers sont calculés directement à partir des hypothèses actuelles, sans extrapolation de marché."}</p></div>
          <div className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: C.blueSoft, borderColor: `${C.blue}33` }}><Beef size={18} style={{ color: C.blue }} /><p className="text-xs leading-relaxed" style={{ color: C.navy }}>{lang === "ar" ? "تظل أعداد المزارعين والمربين غير متاحة إلى حين إدخال مصدر موثق." : "Les volumes d'agriculteurs et d'éleveurs restent indisponibles jusqu'à l'ajout d'une source documentée."}</p></div>
          <div className="rounded-2xl border p-4" style={{ background: C.ivory, borderColor: C.border }}><div className="flex justify-between text-xs font-bold mb-2" style={{ color: C.navy }}><span>{lang === "ar" ? "تقدم النموذج المالي" : "Progression du modèle financier"}</span><span>{rows[4]?.resultNet >= 0 ? "5/5" : "3/5"}</span></div><div className="h-2 rounded-full overflow-hidden" style={{ background: C.border }}><div className="h-full rounded-full" style={{ width: rows[4]?.resultNet >= 0 ? "100%" : "60%", background: `linear-gradient(90deg, ${C.green}, ${C.gold})` }} /></div></div>
        </div>
      </div>
    </section>
  );
}
