import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { Lock, SlidersHorizontal, Activity, Info } from "lucide-react";
import { C, Card, SectionTitle, DataBadge, Tip, fmtNumber } from "./shared";
import { DEFAULT_ASSUMPTIONS, projectYears, breakEven, roi, npv, irr, breakEvenCurve, fmtCompact, SCENARIOS } from "../finance/engine";

const ChartCard = ({ title, tip, children, badge, badges }) => (
  <Card>
    <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
      <div className="text-sm font-semibold" style={{ color: C.navy }}>
        {tip ? <Tip text={tip}><span>{title}</span></Tip> : title}
      </div>
      {badge && <DataBadge type={badge} labels={badges} />}
    </div>
    {children}
  </Card>
);

const tickFmt = (lang) => (v) => fmtCompact(v, lang);

export default function FinanceSection({ x, lang, badges, assumptions, isAdmin }) {
  const [tab, setTab] = useState(0);
  const a = { ...DEFAULT_ASSUMPTIONS, ...(assumptions || {}) };
  const [rate, setRate] = useState(a.discountRate);
  const [model, setModel] = useState({ insured: 1, price: 1, frequency: 1, reinsurance: 1, inflation: 1 });

  const safe = (v, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  Object.keys(a).forEach((k) => { if (typeof a[k] === "number") a[k] = safe(a[k]); });
  const rows = useMemo(() => projectYears(a), [a]);
  const be = useMemo(() => breakEven(a), [a]);
  const roiC = useMemo(() => roi(rows, a.initialInvestment), [rows, a]);
  const npvC = useMemo(() => npv({ ...a, discountRate: rate }, rows), [a, rows, rate]);
  const irrC = useMemo(() => irr(a, rows), [a, rows]);
  const beCurve = useMemo(() => breakEvenCurve(a, SCENARIOS.central.mult, Math.max(be.viable ? be.insuredMin * 2 : 0, a.insuredY1 * 2, 20000)), [a, be]);

  /* Tarification */
  const riskCost = (a.claimFreq / 100) * a.indemnityAvg;
  const loading = riskCost * ((a.reinsRate + a.distribRate) / 100);
  const margin = riskCost * 0.15;
  const premiumCalc = riskCost + loading + margin;

  /* ROI par scénario */
  const roiByScenario = useMemo(() => (["pessimiste", "central", "optimiste"]).map((k) => {
    const r = projectYears(a, SCENARIOS[k].mult);
    return { k, roi: roi(r, a.initialInvestment) };
  }), [a]);

  const chartData = rows.map((r) => ({
    ...r,
    name: `${lang === "ar" ? "سنة" : "Année"} ${r.year}`,
  }));

  const fmt = (v) => fmtNumber(v, lang);
  const y3 = rows[2];
  const modelA = useMemo(() => ({ ...a, insuredY1: a.insuredY1 * model.insured, premiumAvg: a.premiumAvg * model.price, claimFreq: Math.min(100, a.claimFreq * model.frequency), reinsRate: Math.min(100, a.reinsRate * model.reinsurance), costInflation: Math.min(100, a.costInflation * model.inflation) }), [a, model]);
  const modelRows = useMemo(() => projectYears(modelA), [modelA]);
  const modelNet = modelRows.reduce((sum, row) => sum + row.resultNet, 0);

  return (
    <section id="financier" className="relative py-16 md:py-20 overflow-hidden" style={{ backgroundColor: C.ivory }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
          <div className="mt-2"><DataBadge type="simulation" labels={badges} /></div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {x.tabs.map((tb, i) => (
            <button key={i} onClick={() => setTab(i)}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:-translate-y-px"
              style={tab === i
                ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, borderColor: C.navy, color: C.white, boxShadow: "0 8px 18px -8px rgba(11,30,57,0.5)" }
                : { borderColor: C.border, color: C.slate, backgroundColor: C.white }}>
              {tb}
            </button>
          ))}
        </div>

        {/* A. HYPOTHÈSES */}
        {tab === 0 && (
          <Card>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
              <h3 className="text-lg font-bold" style={{ color: C.navy }}>{x.hypTitle}</h3>
              <span className="text-xs flex items-center gap-1.5" style={{ color: C.slateLight }}>
                <Lock size={12} /> {x.hypEditNote}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(x.hyp).map((k) => (
                <div key={k} className="rounded-xl border p-4" style={{ borderColor: C.border, backgroundColor: C.ivory }}>
                  <div className="text-xs mb-1" style={{ color: C.slate }}>{x.hyp[k]}</div>
                  <div className="font-bold text-lg" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>
                    {k === "growthRate" || k === "claimFreq" || k === "distribRate" || k === "reinsRate" || k === "costInflation" || k === "discountRate"
                      ? `${fmtNumber(a[k], lang)} %`
                      : k === "insuredY1" ? fmtNumber(a[k], lang) : `${fmtNumber(a[k], lang)}${k.includes("Costs") || k.includes("Investment") ? "" : " MRU"}`}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* B. TARIFICATION */}
        {tab === 1 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-bold mb-2" style={{ color: C.navy }}>{x.pricing.title}</h3>
              <div className="font-mono text-xs mb-5 px-3 py-2 rounded-lg" style={{ backgroundColor: C.blueSoft, color: C.blue }}>{x.pricing.formula}</div>
              {[
                [x.pricing.riskCost, riskCost, C.blue],
                [x.pricing.loading, loading, C.gold],
                [x.pricing.margin, margin, C.orange],
              ].map(([label, v, color], i) => (
                <div key={i} className="flex justify-between items-center py-2.5 border-b" style={{ borderColor: C.border }}>
                  <span className="text-sm" style={{ color: C.slate }}>{label}</span>
                  <span className="font-semibold text-sm" style={{ color }}>{fmt(v)} MRU</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-3 mt-1">
                <span className="text-sm font-bold" style={{ color: C.navy }}>{x.pricing.premium}</span>
                <span className="font-extrabold text-lg" style={{ color: C.green, fontFamily: "var(--font-display)" }}>{fmt(premiumCalc)} MRU</span>
              </div>
            </Card>
            <ChartCard title={x.pricing.compare} badge="simulation" badges={badges}>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={[
                  { name: lang === "ar" ? "المحتسَب" : "Calculée", v: premiumCalc },
                  { name: lang === "ar" ? "الافتراضية" : "Hypothétique", v: a.premiumAvg },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={tickFmt(lang)} />
                  <Tooltip formatter={(v) => `${fmt(v)} MRU`} />
                  <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                    <Cell fill={C.green} /><Cell fill={C.blue} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* C. PROJECTIONS */}
        {tab === 2 && (
          <div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <ChartCard title={x.proj.charts.premiums} tip={x.tooltips.premiums} badge="simulation" badges={badges}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} />
                    <Tooltip formatter={(v) => `${fmt(v)} MRU`} />
                    <Bar dataKey="premiums" fill={C.blue} radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={x.proj.charts.claims} badge="simulation" badges={badges}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="claims" fill={C.orange} radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={x.proj.charts.net} badge="simulation" badges={badges}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} />
                    <Tooltip formatter={(v) => `${fmt(v)} MRU`} />
                    <ReferenceLine y={0} stroke={C.slateLight} />
                    <Bar dataKey="resultNet" radius={[5, 5, 0, 0]}>
                      {chartData.map((r, i) => <Cell key={i} fill={r.resultNet >= 0 ? C.green : C.red} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={x.proj.charts.cf} badge="simulation" badges={badges}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.gold} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={C.gold} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} />
                    <Tooltip formatter={(v) => `${fmt(v)} MRU`} />
                    <ReferenceLine y={0} stroke={C.slateLight} />
                    <Area type="monotone" dataKey="cumCF" stroke={C.gold} fill="url(#cfGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={x.proj.charts.insured} badge="hypothese" badges={badges}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Area type="monotone" dataKey="insured" stroke={C.green} fill={C.greenSoft} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title={x.proj.charts.lossRatio} tip={x.tooltips.lossRatio} badge="simulation" badges={badges}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} unit="%" />
                    <Tooltip formatter={(v) => `${Number(v).toFixed(1)} %`} />
                    <ReferenceLine y={100} stroke={C.red} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="lossRatio" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            {/* Table de projection */}
            <Card>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.proj.title}</div>
              <div className="overflow-x-auto">
                <table className="tbl w-full text-xs min-w-[900px]">
                  <thead>
                    <tr style={{ backgroundColor: C.navy }}>
                      {x.proj.head.map((h, i) => <th key={i} className="text-start px-3 py-3 font-semibold text-white first:rounded-s-lg last:rounded-e-lg">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: C.border }}>
                        <td className="px-3 py-2.5 font-semibold" style={{ color: C.navy }}>{r.year}</td>
                        <td className="px-3 py-2.5" style={{ color: C.slate }}>{fmt(r.insured)}</td>
                        <td className="px-3 py-2.5" style={{ color: C.slate }}>{fmt(r.premiums)}</td>
                        <td className="px-3 py-2.5" style={{ color: C.slate }}>{fmt(r.claims)}</td>
                        <td className="px-3 py-2.5" style={{ color: C.slate }}>{fmt(r.indemnities)}</td>
                        <td className="px-3 py-2.5" style={{ color: C.slate }}>{fmt(r.fixedCosts + r.distribution + r.reinsurance)}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: r.resultTech >= 0 ? C.green : C.red }}>{fmt(r.resultTech)}</td>
                        <td className="px-3 py-2.5 font-bold" style={{ color: r.resultNet >= 0 ? C.green : C.red }}>{fmt(r.resultNet)}</td>
                        <td className="px-3 py-2.5 font-medium" style={{ color: r.cumCF >= 0 ? C.green : C.red }}>{fmt(r.cumCF)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* D. COMPTE DE RÉSULTAT */}
        {tab === 3 && y3 && (
          <Card className="max-w-3xl">
            <h3 className="text-lg font-bold mb-5" style={{ color: C.navy }}>{x.pl.title}</h3>
            {[
              [x.pl.revenues, y3.premiums, 0, C.navy],
              [x.pl.claims, -y3.indemnities, 1, C.red],
              [x.pl.reins, -y3.reinsurance, 1, C.red],
              [x.pl.resultTech, y3.resultTech, 2, y3.resultTech >= 0 ? C.green : C.red],
              [x.pl.distrib, -y3.distribution, 1, C.red],
              [x.pl.fixed, -y3.fixedCosts, 1, C.red],
              [x.pl.resultOp, y3.resultOp, 2, y3.resultOp >= 0 ? C.green : C.red],
              [x.pl.resultNet, y3.resultNet, 3, y3.resultNet >= 0 ? C.green : C.red],
            ].map(([label, v, lvl, color], i) => (
              <div key={i} className={`flex justify-between items-center px-4 py-3 ${lvl >= 2 ? "rounded-lg mt-1" : "border-b"}`}
                style={lvl >= 2
                  ? { backgroundColor: lvl === 3 ? C.navy : C.ivory, border: `1px solid ${C.border}` }
                  : { borderColor: C.border, paddingInlineStart: lvl === 1 ? "2rem" : undefined }}>
                <span className={`text-sm ${lvl >= 2 ? "font-bold" : ""}`} style={{ color: lvl === 3 ? C.white : C.slate }}>{label}</span>
                <span className="font-bold text-sm" style={{ color: lvl === 3 ? (y3.resultNet >= 0 ? "#7EE2B8" : "#FF9E93") : color, fontFamily: "var(--font-display)" }}>
                  {v > 0 && lvl < 2 ? "" : ""}{fmt(v)} MRU
                </span>
              </div>
            ))}
          </Card>
        )}

        {/* E. RENTABILITÉ */}
        {tab === 4 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <h3 className="text-lg font-bold mb-5" style={{ color: C.navy }}>
                <Tip text={x.tooltips.breakeven}><span>{x.be.title}</span></Tip>
              </h3>
              {be.viable ? (
                <div className="space-y-3">
                  {[
                    [x.be.margin, `${fmt(be.marginPerInsured)} MRU`],
                    [x.be.insuredMin, fmt(be.insuredMin)],
                    [x.be.premiumMin, `${fmt(be.premiumMin)} MRU`],
                    [x.be.period, x.be.periodVal],
                  ].map(([l, v], i) => (
                    <div key={i} className="flex justify-between items-center rounded-xl border px-4 py-3" style={{ borderColor: C.border, backgroundColor: C.ivory }}>
                      <span className="text-sm" style={{ color: C.slate }}>{l}</span>
                      <span className="font-bold" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-medium" style={{ color: C.red }}>{x.be.notViable}</p>
              )}
            </Card>
            <ChartCard title={x.be.chart} badge="simulation" badges={badges}>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={beCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="insured" tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} />
                  <Tooltip formatter={(v) => `${fmt(v)} MRU`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {be.viable && <ReferenceLine x={be.insuredMin} stroke={C.gold} strokeWidth={2} strokeDasharray="5 4" />}
                  <Line type="monotone" dataKey="revenue" name={x.be.revenue} stroke={C.green} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="totalCost" name={x.be.cost} stroke={C.red} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}

        {/* INTERACTIVE MODEL BUILDER */}
        {tab === 6 && (
          <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-6">
            <Card>
              <div className="flex items-start gap-3 mb-5"><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.blueSoft, color: C.blue }}><SlidersHorizontal size={18} /></div><div><h3 className="text-lg font-bold" style={{ color: C.navy }}>{x.model.title}</h3><p className="text-xs leading-relaxed mt-1" style={{ color: C.slate }}>{x.model.desc}</p></div></div>
              <div className="space-y-5">{[["insured", x.model.insured], ["price", x.model.price], ["frequency", x.model.frequency], ["reinsurance", x.model.reinsurance], ["inflation", x.model.inflation]].map(([key, label]) => <div key={key}><div className="flex justify-between text-xs font-semibold mb-2" style={{ color: C.navy }}><span>{label}</span><span style={{ color: C.blue }}>{model[key].toFixed(2)}×</span></div><input aria-label={label} type="range" min={key === "frequency" ? 0.5 : 0.7} max={key === "insured" ? 2 : 1.5} step="0.05" value={model[key]} onChange={(e) => setModel({ ...model, [key]: Number(e.target.value) })} className="w-full" style={{ "--val": `${((model[key] - (key === "frequency" ? 0.5 : 0.7)) / ((key === "insured" ? 2 : 1.5) - (key === "frequency" ? 0.5 : 0.7))) * 100}%` }} /></div>)}</div>
              <div className="rounded-xl border p-4 mt-6 text-xs leading-relaxed flex items-start gap-2" style={{ background: C.ivory, borderColor: C.border, color: C.slate }}><Info size={14} className="shrink-0" style={{ color: C.blue }} /> {x.model.formula}</div>
            </Card>
            <div className="space-y-6"><Card><div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-2"><Activity size={18} style={{ color: C.green }} /><h3 className="text-sm font-bold" style={{ color: C.navy }}>{x.model.result}</h3></div><DataBadge type="simulation" labels={badges} /></div><div className="grid sm:grid-cols-3 gap-3 mb-5">{[[x.model.scenario, x.model.central, C.blue], [x.returns.roi, `${roi(modelRows, a.initialInvestment).toFixed(1)} %`, C.green], [x.returns.npv, `${fmt(npv(modelA, modelRows))} MRU`, npv(modelA, modelRows) >= 0 ? C.green : C.orange]].map(([label, value, tone]) => <div key={label} className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.ivory }}><div className="text-[10px] uppercase tracking-wider" style={{ color: C.slateLight }}>{label}</div><div className="text-lg font-bold mt-2" style={{ color: tone, fontFamily: "var(--font-display)" }}>{value}</div></div>)}</div><ResponsiveContainer width="100%" height={270}><LineChart data={modelRows.map((row) => ({ ...row, name: `${lang === "ar" ? "سنة" : "Année"} ${row.year}` }))}><CartesianGrid strokeDasharray="3 3" stroke={C.border} /><XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={tickFmt(lang)} /><Tooltip formatter={(v) => `${fmt(v)} MRU`} /><ReferenceLine y={0} stroke={C.slateLight} /><Line type="monotone" dataKey="resultNet" name={lang === "ar" ? "صافي النتيجة" : "Résultat net"} stroke={C.green} strokeWidth={2.5} dot={{ r: 3 }} /><Line type="monotone" dataKey="premiums" name={lang === "ar" ? "الأقساط" : "Primes"} stroke={C.blue} strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></Card><Card className="!p-4"><div className="text-xs font-semibold" style={{ color: C.slate }}>{lang === "ar" ? "ملاحظة شفافية" : "Note de transparence"}</div><div className="text-xs mt-2 leading-relaxed" style={{ color: C.slateLight }}>{lang === "ar" ? "المؤشرات تتغير محليًا دون إعادة تحميل الصفحة، وتعتمد فقط على الفرضيات الحالية." : "Les indicateurs se recalculent localement sans rechargement et reposent uniquement sur les hypothèses courantes."}</div></Card></div>
          </div>
        )}

        {/* F/G/H. ROI · VAN · TRI */}
        {tab === 5 && (
          <div>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <Card>
                <Tip text={`${x.returns.roiF} — ${x.returns.roiI}`}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.blue }}>{x.returns.roi}</span>
                </Tip>
                <div className="text-3xl font-extrabold mt-2 mb-4" style={{ color: roiC >= 0 ? C.green : C.red, fontFamily: "var(--font-display)" }}>
                  {roiC.toFixed(1)} %
                </div>
                {roiByScenario.map((s, i) => (
                  <div key={s.k} className="flex justify-between text-sm py-1.5 border-b last:border-0" style={{ borderColor: C.border }}>
                    <span style={{ color: C.slate }}>{[x.returns.roiP, x.returns.roiC, x.returns.roiO][i]}</span>
                    <span className="font-semibold" style={{ color: s.roi >= 0 ? C.green : C.red }}>{s.roi.toFixed(1)} %</span>
                  </div>
                ))}
              </Card>
              <Card>
                <Tip text={`${x.returns.npvF} — ${x.returns.npvI}`}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.blue }}>{x.returns.npv}</span>
                </Tip>
                <div className="text-3xl font-extrabold mt-2 mb-4" style={{ color: npvC >= 0 ? C.green : C.red, fontFamily: "var(--font-display)" }}>
                  {fmt(npvC)} <span className="text-base font-semibold">MRU</span>
                </div>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: C.slate }}>{x.returns.rate} — {rate} %</label>
                <input type="range" min={2} max={25} step={0.5} value={rate} onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full" style={{ "--val": `${((rate - 2) / 23) * 100}%` }} />
              </Card>
              <Card>
                <Tip text={`${x.returns.irrF} — ${x.returns.irrI}`}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.blue }}>{x.returns.irr}</span>
                </Tip>
                <div className="text-3xl font-extrabold mt-2 mb-4" style={{ color: irrC !== null && irrC >= rate ? C.green : C.orange, fontFamily: "var(--font-display)" }}>
                  {irrC !== null ? `${irrC.toFixed(1)} %` : "—"}
                </div>
                <p className="text-xs leading-relaxed" style={{ color: C.slate }}>
                  {irrC === null ? x.returns.irrNone : (npvC >= 0 ? x.returns.interpPos : x.returns.interpNeg)}
                </p>
              </Card>
            </div>
            <ChartCard title={x.returns.roi} badge="simulation" badges={badges}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={roiByScenario.map((s, i) => ({ name: [x.returns.roiP, x.returns.roiC, x.returns.roiO][i], roi: Number(s.roi.toFixed(1)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${v} %`} />
                  <ReferenceLine y={0} stroke={C.slateLight} />
                  <Bar dataKey="roi" radius={[6, 6, 0, 0]}>
                    {[C.red, C.gold, C.green].map((c, i) => <Cell key={i} fill={c} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>
    </section>
  );
}
