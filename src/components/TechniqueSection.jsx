import React, { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ChevronRight, Database, Cpu, Gauge, Zap, Banknote, AlertTriangle, CheckCircle2, Droplets, Thermometer, Sprout, Beef, MapPinned, ShieldAlert } from "lucide-react";
import { C, Card, SectionTitle, RISK_COLORS, fmtNumber } from "./shared";

const ARCH_ICONS = [Database, Cpu, Gauge, Zap, Banknote];
const technicalTabs = {
  fr: ["Climate & risques", "Agriculture", "Élevage", "Déclencheurs", "Basis risk", "Qualité des données", "Risque géographique"],
  ar: ["المناخ والمخاطر", "الزراعة", "الثروة الحيوانية", "مؤشرات التفعيل", "خطر الأساس", "جودة البيانات", "الخطر الجغرافي"],
};
const unavailable = (lang) => lang === "ar" ? "البيانات غير متاحة" : "Donnée non disponible";
const pending = (lang) => lang === "ar" ? "في انتظار البيانات" : "En attente de données";

function Metric({ icon: Icon, label, value, tone = C.blue, lang }) {
  return <div className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.ivory }}><div className="flex items-center justify-between"><Icon size={17} style={{ color: tone }} /><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tone }}>{lang === "ar" ? "مؤشر" : "Indicateur"}</span></div><div className="text-sm font-bold mt-4" style={{ color: value === unavailable(lang) ? C.slateLight : C.navy }}>{value}</div><div className="text-xs mt-1" style={{ color: C.slate }}>{label}</div></div>;
}

export function TechniqueSection({ x, lang, dir }) {
  const [tab, setTab] = useState(0);
  const tabs = technicalTabs[lang];
  const na = unavailable(lang);
  const waiting = pending(lang);
  const riskCards = [
    [Droplets, lang === "ar" ? "الجفاف" : "Sécheresse", na, C.orange],
    [ShieldAlert, lang === "ar" ? "الفيضانات" : "Inondations", na, C.red],
    [Thermometer, lang === "ar" ? "الحرارة القصوى" : "Températures extrêmes", na, C.orange],
    [Droplets, lang === "ar" ? "التساقطات" : "Pluviométrie", na, C.blue],
  ];
  return (
    <section id="technique" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <SectionTitle eyebrow={x.eyebrow} title={lang === "ar" ? "مركز ذكاء المخاطر المناخية" : "Climate Risk Intelligence Center"} desc={x.desc} />
        <div className="flex gap-2 overflow-x-auto pb-2 mb-7" role="tablist" aria-label={lang === "ar" ? "أقسام الدراسة التقنية" : "Onglets de l'étude technique"}>
          {tabs.map((label, i) => <button key={label} role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className="shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-all" style={tab === i ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, borderColor: C.navy, color: C.white } : { borderColor: C.border, color: C.slate, background: C.white }}>{label}</button>)}
        </div>

        {tab === 0 && <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">{riskCards.map(([Icon, label, value, tone]) => <Metric key={label} icon={Icon} label={label} value={value} tone={tone} lang={lang} />)}</div>
          <Card className="mb-8"><div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold" style={{ color: C.navy }}>{lang === "ar" ? "لوحة مؤشرات المناخ" : "Monitor climatique"}</h3><span className="text-xs px-2.5 py-1 rounded-full" style={{ color: C.orange, background: C.orangeSoft }}>{waiting}</span></div><div className="grid md:grid-cols-2 gap-5"><div className="space-y-3">{[lang === "ar" ? "التواتر" : "Fréquence", lang === "ar" ? "الشدة" : "Intensité", lang === "ar" ? "المدة" : "Durée", lang === "ar" ? "الموسمية" : "Saisonnalité"].map((label) => <div key={label} className="flex items-center justify-between border-b pb-2 text-sm" style={{ borderColor: C.border }}><span style={{ color: C.slate }}>{label}</span><span style={{ color: C.slateLight }}>{na}</span></div>)}</div><div className="rounded-xl p-5 flex items-center justify-center text-center" style={{ background: `radial-gradient(circle at 50% 25%, ${C.blueSoft}, ${C.ivory})` }}><div><Droplets size={30} className="mx-auto mb-3" style={{ color: C.blue }} /><div className="text-sm font-bold" style={{ color: C.navy }}>{lang === "ar" ? "أضف سلسلة مناخية موثقة" : "Ajoutez une série climatique documentée"}</div><div className="text-xs mt-2 max-w-xs" style={{ color: C.slate }}>{lang === "ar" ? "لا تعرض المنصة قيمًا مناخية غير موجودة في مصادر المشروع." : "La plateforme n'affiche aucune valeur climatique absente des sources du projet."}</div></div></div></div></Card>
          <Architecture x={x} dir={dir} />
        </>}
        {tab === 1 && <ResearchPanel lang={lang} icon={Sprout} title={lang === "ar" ? "التعرض الزراعي" : "Exposition agricole"} items={lang === "ar" ? ["المحاصيل المدروسة", "المساحات المؤمنة", "الخسائر التاريخية", "مؤشر الإجهاد الزراعي"] : ["Cultures étudiées", "Surface assurée", "Pertes historiques", "Indice de stress agricole"]} />}
        {tab === 2 && <ResearchPanel lang={lang} icon={Beef} title={lang === "ar" ? "التعرض الرعوي" : "Exposition pastorale"} items={lang === "ar" ? ["عدد الحيوانات المؤمن عليها", "المناطق الرعوية", "توفر المراعي", "مؤشر الإجهاد الرعوي"] : ["Animaux assurés", "Zones pastorales", "Disponibilité des pâturages", "Indice de stress pastoral"]} />}
        {tab === 3 && <TriggerDesign lang={lang} x={x} />}
        {tab === 4 && <BasisRiskPanel lang={lang} />}
        {tab === 5 && <DataQualityPanel lang={lang} />}
        {tab === 6 && <GeographicPanel lang={lang} />}
      </div>
    </section>
  );
}

function Architecture({ x, dir }) {
  return <Card className="mb-8"><h3 className="text-lg font-bold mb-6" style={{ color: C.navy }}>{x.archTitle}</h3><div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-2">{x.arch.map((step, i) => { const Icon = ARCH_ICONS[i]; return <React.Fragment key={i}><div className="flex-1 rounded-xl border p-4 flex md:flex-col items-center md:items-start gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: C.border, background: `linear-gradient(160deg, ${C.ivory}, #FFFFFF)` }}><div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, border: `1px solid ${C.gold}44` }}><Icon size={18} color={C.goldLight} /></div><div><div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.gold }}>{String(i + 1).padStart(2, "0")}</div><div className="text-sm font-semibold" style={{ color: C.navy }}>{step}</div></div></div>{i < x.arch.length - 1 && <div className="hidden md:flex items-center"><ChevronRight size={18} style={{ color: C.gold }} className={dir === "rtl" ? "rotate-180" : ""} /></div>}</React.Fragment>; })}</div><div className="overflow-x-auto mt-7"><table className="tbl w-full text-xs md:text-sm min-w-[820px]"><thead><tr style={{ backgroundColor: C.navy }}>{x.indicesHead.map((h, i) => <th key={i} className="text-start px-3 py-3 font-semibold text-white">{h}</th>)}</tr></thead><tbody>{x.indices.map((row, i) => <tr key={i} className="border-b" style={{ borderColor: C.border }}>{row.map((cell, j) => <td key={j} className="px-3 py-3" style={{ color: j === 0 ? C.navy : C.slate, fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>)}</tr>)}</tbody></table></div></Card>;
}

function ResearchPanel({ lang, icon: Icon, title, items }) {
  const na = unavailable(lang);
  return <Card><div className="flex items-center gap-3 mb-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.greenSoft }}><Icon size={19} style={{ color: C.green }} /></div><div><h3 className="text-lg font-bold" style={{ color: C.navy }}>{title}</h3><div className="text-xs" style={{ color: C.slateLight }}>{lang === "ar" ? "بطاقة بيانات قابلة للتحديث من لوحة المشرف" : "Fiche actualisable depuis l'espace superviseur"}</div></div></div><div className="grid sm:grid-cols-2 gap-4">{items.map((label) => <div key={label} className="rounded-xl border p-4" style={{ borderColor: C.border }}><div className="text-xs" style={{ color: C.slate }}>{label}</div><div className="font-bold mt-3" style={{ color: C.slateLight }}>{na}</div><div className="text-[10px] mt-1" style={{ color: C.slateLight }}>{lang === "ar" ? "المصدر مطلوب" : "Source requise"}</div></div>)}</div></Card>;
}

function TriggerDesign({ lang, x }) {
  const steps = lang === "ar" ? ["عادي", "يقظة", "تفعيل", "دفع أقصى"] : ["Normal", "Alerte", "Trigger", "Paiement maximal"];
  return <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-6"><Card><h3 className="text-lg font-bold mb-3" style={{ color: C.navy }}>{lang === "ar" ? "تصميم مؤشرات التفعيل" : "Conception des déclencheurs paramétriques"}</h3><p className="text-sm leading-relaxed mb-5" style={{ color: C.slate }}>{x.desc}</p>{[lang === "ar" ? "المؤشر المستخدم" : "Indice utilisé", lang === "ar" ? "مصدر البيانات" : "Source des données", lang === "ar" ? "فترة الملاحظة" : "Période d'observation", lang === "ar" ? "المنطقة" : "Zone géographique"].map((label) => <div key={label} className="flex justify-between gap-3 border-b py-3 text-sm" style={{ borderColor: C.border }}><span style={{ color: C.slate }}>{label}</span><span style={{ color: C.slateLight }}>{unavailable(lang)}</span></div>)}</Card><Card><h3 className="text-sm font-bold mb-5" style={{ color: C.navy }}>{lang === "ar" ? "المسار البصري للتفعيل" : "Chaîne visuelle du déclenchement"}</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{steps.map((step, i) => <div key={step} className="relative rounded-xl p-4 text-center border" style={{ background: i === 2 ? C.orangeSoft : C.ivory, borderColor: i === 2 ? `${C.orange}66` : C.border }}><div className="w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs" style={{ background: i === 3 ? C.green : C.navy, color: C.white }}>{i + 1}</div><div className="text-xs font-semibold mt-3" style={{ color: C.navy }}>{step}</div></div>)}</div><div className="mt-5 rounded-xl border p-4 text-xs leading-relaxed" style={{ background: C.blueSoft, borderColor: `${C.blue}33`, color: C.navy }}>{lang === "ar" ? "تُعاير العتبات انطلاقًا من بيانات تاريخية موثقة قبل اعتماد أي منتج." : "Les seuils doivent être calibrés sur des données historiques documentées avant tout usage produit."}</div></Card></div>;
}

function BasisRiskPanel({ lang }) {
  const labels = lang === "ar" ? ["خطر الأساس المحتمل", "ارتباط المؤشر بالخسارة الفعلية", "إيجابيات كاذبة", "سلبيات كاذبة", "جودة البيانات"] : ["Basis Risk potentiel", "Corrélation indice / perte réelle", "Faux positifs", "Faux négatifs", "Qualité des données"];
  return <Card><div className="flex items-center gap-2 mb-3"><AlertTriangle size={18} style={{ color: C.orange }} /><h3 className="text-lg font-bold" style={{ color: C.navy }}>{lang === "ar" ? "تحليل خطر الأساس" : "Analyse du Basis Risk"}</h3></div><p className="text-sm leading-relaxed mb-6" style={{ color: C.slate }}>{lang === "ar" ? "يقيس خطر الأساس الفجوة بين المؤشر المناخي والخسارة الفعلية. لا تعرض المنصة نسبة غير محسوبة." : "Le Basis Risk mesure l'écart entre l'indice climatique et la perte réelle. Aucun pourcentage n'est affiché sans calcul documenté."}</p><div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">{labels.map((label) => <Metric key={label} icon={ShieldAlert} label={label} value={unavailable(lang)} tone={C.orange} lang={lang} />)}</div></Card>;
}

function DataQualityPanel({ lang }) {
  const rows = lang === "ar" ? [["التساقطات", "يومي / عشري", "المصدر مطلوب"], ["الحرارة", "يومي", "المصدر مطلوب"], ["الغطاء النباتي", "16 يومًا", "المصدر مطلوب"], ["الخسائر الزراعية", "تاريخية", "المصدر مطلوب"], ["بيانات المراعي", "موسمية", "المصدر مطلوب"]] : [["Pluviométrie", "Quotidienne / dekadale", "Source requise"], ["Température", "Quotidienne", "Source requise"], ["Végétation", "16 jours", "Source requise"], ["Pertes agricoles", "Historique", "Source requise"], ["Données pastorales", "Saisonnière", "Source requise"]];
  return <Card><h3 className="text-lg font-bold mb-4" style={{ color: C.navy }}>{lang === "ar" ? "جودة البيانات والمصادر" : "Qualité et sources des données"}</h3><div className="overflow-x-auto"><table className="tbl w-full text-sm min-w-[620px]"><thead><tr style={{ background: C.navy }}>{(lang === "ar" ? ["نوع البيانات", "التواتر", "الحالة"] : ["Type de données", "Fréquence", "Statut"]).map((h) => <th key={h} className="text-start px-4 py-3 text-white">{h}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row[0]} className="border-b" style={{ borderColor: C.border }}>{row.map((cell, i) => <td key={i} className="px-4 py-3" style={{ color: i === 0 ? C.navy : C.slateLight, fontWeight: i === 0 ? 600 : 400 }}>{cell}</td>)}</tr>)}</tbody></table></div></Card>;
}

function GeographicPanel({ lang }) {
  const labels = lang === "ar" ? ["الولايات", "المقاطعات", "المناطق الزراعية", "المناطق الرعوية", "مؤشر المخاطر", "التعرض"] : ["Wilayas", "Moughataas", "Zones agricoles", "Zones pastorales", "Risk score", "Exposition"];
  return <Card><div className="flex items-center gap-2 mb-3"><MapPinned size={18} style={{ color: C.blue }} /><h3 className="text-lg font-bold" style={{ color: C.navy }}>{lang === "ar" ? "التحليل الجغرافي" : "Analyse spatiale"}</h3></div><p className="text-sm mb-6" style={{ color: C.slate }}>{lang === "ar" ? "الطبقة الجغرافية الحالية تخطيط توضيحي؛ استبدلها ببيانات موثقة عند توفرها." : "La couche géographique actuelle est schématique ; remplacez-la par des données documentées lorsqu'elles seront disponibles."}</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{labels.map((label) => <Metric key={label} icon={MapPinned} label={label} value={unavailable(lang)} tone={C.blue} lang={lang} />)}</div></Card>;
}

/* Simulateur de déclenchement : mm observés vs seuil contractuel */
export function TriggerSimulator({ x, lang }) {
  const [observed, setObserved] = useState(185);
  const [threshold, setThreshold] = useState(250);
  const [capital, setCapital] = useState(100000);
  const riskFromDeficit = (deficit) => { if (deficit < 10) return { key: "normal", label: { fr: "Faible", ar: "منخفض" }, pct: 0 }; if (deficit < 20) return { key: "vigilance", label: { fr: "Modéré", ar: "معتدل" }, pct: 25 }; if (deficit < 35) return { key: "secheresse", label: { fr: "Élevé", ar: "مرتفع" }, pct: 50 }; if (deficit < 50) return { key: "severe", label: { fr: "Sévère", ar: "حاد" }, pct: 75 }; return { key: "critique", label: { fr: "Critique", ar: "حرج" }, pct: 100 }; };
  const deficit = useMemo(() => threshold > 0 ? Math.max(0, ((threshold - observed) / threshold) * 100) : 0, [observed, threshold]);
  const risk = useMemo(() => riskFromDeficit(deficit), [deficit]);
  const triggered = deficit >= 10;
  const payout = useMemo(() => triggered ? capital * (risk.pct / 100) : 0, [triggered, capital, risk]);
  const curve = useMemo(() => { const pts = []; for (let mm = 0; mm <= Math.max(400, threshold * 1.4); mm += 10) { const d = threshold > 0 ? Math.max(0, ((threshold - mm) / threshold) * 100) : 0; pts.push({ mm, payoutRate: d >= 10 ? riskFromDeficit(d).pct : 0 }); } return pts; }, [threshold]);
  return <section id="declenchement" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20"><SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} /><div className="grid lg:grid-cols-5 gap-6"><Card className="lg:col-span-2 h-fit">{[{ label: x.observed, val: observed, set: setObserved, min: 0, max: 500, step: 5, unit: "mm" }, { label: x.threshold, val: threshold, set: setThreshold, min: 50, max: 500, step: 5, unit: "mm" }].map((p) => <div key={p.label} className="mb-5"><div className="flex justify-between text-xs font-semibold mb-2.5" style={{ color: C.navy }}><span>{p.label}</span><span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: C.blueSoft, color: C.blue }}>{p.val} {p.unit}</span></div><input type="range" min={p.min} max={p.max} step={p.step} value={p.val} onChange={(e) => p.set(Number(e.target.value))} className="w-full" style={{ "--val": `${((p.val - p.min) / (p.max - p.min)) * 100}%` }} /></div>)}<div className="mb-2"><label className="text-xs font-semibold mb-2 block" style={{ color: C.navy }}>{x.capital}</label><input type="number" value={capital} min={0} step={5000} onChange={(e) => setCapital(Math.max(0, Number(e.target.value) || 0))} className="input-polished w-full border rounded-lg px-3 py-2.5 text-sm" style={{ borderColor: C.border, color: C.navy }} /></div><p className="text-xs italic mt-4 pt-3 border-t" style={{ color: C.slateLight, borderColor: C.border }}>{x.example}</p></Card><Card className="lg:col-span-3"><div className="grid sm:grid-cols-2 gap-4 mb-6">{[[x.deficit, `${deficit.toFixed(0)} %`, C.orange], [x.riskLevel, risk.label[lang] || risk.label.fr, RISK_COLORS[risk.key]], [x.trigger, triggered ? x.yes : x.no, triggered ? C.red : C.green], [x.payout, `${fmtNumber(payout, lang)} MRU`, C.blue]].map(([label, value, tone]) => <div key={label} className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}><div className="text-xs mb-1" style={{ color: C.slateLight }}>{label}</div><div className="font-bold text-xl" style={{ color: tone, fontFamily: "var(--font-display)" }}>{value}</div></div>)}</div><div className="h-52"><ResponsiveContainer width="100%" height="100%"><AreaChart data={curve}><defs><linearGradient id="trigGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.red} stopOpacity={0.3} /><stop offset="100%" stopColor={C.red} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="mm" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} /><Tooltip formatter={(v) => `${v} %`} /><ReferenceLine x={observed} stroke={C.blue} strokeDasharray="4 4" /><ReferenceLine x={threshold} stroke={C.gold} strokeWidth={2} /><Area type="stepAfter" dataKey="payoutRate" stroke={C.red} fill="url(#trigGrad)" strokeWidth={2} name="%" /></AreaChart></ResponsiveContainer></div></Card></div></section>;
}
