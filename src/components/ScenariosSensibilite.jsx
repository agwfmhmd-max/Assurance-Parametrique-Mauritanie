import React, { useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area,
} from "recharts";
import { C, Card, SectionTitle, DataBadge, fmtNumber } from "./shared";
import { projectYears, breakEven, roi, npv, irr, sensitivityHeatmap, fmtCompact, SCENARIOS, YEARS } from "../finance/engine";

/* ============================================================
   SCÉNARIOS — dashboard comparatif pessimiste / central / optimiste
   ============================================================ */
const SC_COLORS = { pessimiste: C.red, central: C.gold, optimiste: C.green };

export function ScenariosSection({ x, lang, badges, assumptions }) {
  const a = assumptions;
  const sc = useMemo(() => {
    const out = {};
    for (const k of ["pessimiste", "central", "optimiste"]) {
      const rows = projectYears(a, SCENARIOS[k].mult);
      out[k] = {
        rows,
        net5: rows.reduce((s, r) => s + r.resultNet, 0),
        premiums5: rows.reduce((s, r) => s + r.premiums, 0),
        roi: roi(rows, a.initialInvestment),
        npv: npv(a, rows),
        irr: irr(a, rows),
        be: breakEven(a, SCENARIOS[k].mult),
      };
    }
    return out;
  }, [a]);

  const names = { pessimiste: x.pess, central: x.cent, optimiste: x.opt };
  const lineData = YEARS.map((y, i) => ({
    name: `${lang === "ar" ? "سنة" : "Année"} ${y}`,
    pessimiste: sc.pessimiste.rows[i].resultNet,
    central: sc.central.rows[i].resultNet,
    optimiste: sc.optimiste.rows[i].resultNet,
  }));
  const kpiData = ["pessimiste", "central", "optimiste"].map((k) => ({
    name: names[k].name,
    roi: Number(sc[k].roi.toFixed(1)),
    lossRatio: Number((sc[k].rows.reduce((s, r) => s + r.lossRatio, 0) / 5).toFixed(1)),
  }));

  return (
    <section id="scenarios" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
        <div className="mt-2"><DataBadge type="simulation" labels={badges} /></div>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {["pessimiste", "central", "optimiste"].map((k) => (
          <Card key={k} className="border-t-4" style={{ borderTopColor: SC_COLORS[k] }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SC_COLORS[k] }} />
              <span className="font-bold" style={{ color: SC_COLORS[k] }}>{names[k].name}</span>
            </div>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: C.slate }}>{names[k].desc}</p>
            <div className="space-y-2 text-sm">
              {[
                [x.cols.net5, sc[k].net5, true],
                [x.cols.roi, sc[k].roi, "pct"],
                [x.cols.npv, sc[k].npv, true],
                [x.cols.irr, sc[k].irr, "pct"],
                [x.cols.be, sc[k].be.viable ? sc[k].be.insuredMin : null, false],
                [x.cols.premiums5, sc[k].premiums5, true],
              ].map(([label, v, isMoney], i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span className="text-xs" style={{ color: C.slateLight }}>{label}</span>
                  <span className="text-xs font-bold" style={{ color: v === null ? C.slateLight : (typeof v === "number" && v < 0 ? C.red : C.navy) }}>
                    {v === null ? "—" : isMoney === true ? `${fmtCompact(v, lang)} MRU` : isMoney === "pct" ? `${Number(v).toFixed(1)} %` : fmtNumber(v, lang)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.chartTitle}</div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => fmtCompact(v, lang)} />
              <Tooltip formatter={(v) => `${fmtNumber(v, lang)} MRU`} />
              <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => names[v]?.name || v} />
              <ReferenceLine y={0} stroke={C.slateLight} />
              <Line type="monotone" dataKey="pessimiste" stroke={C.red} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="central" stroke={C.gold} strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="optimiste" stroke={C.green} strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.chart2Title}</div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={kpiData}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={0} stroke={C.slateLight} />
              <Bar dataKey="roi" name="ROI %" radius={[5, 5, 0, 0]}>
                {kpiData.map((_, i) => <Cell key={i} fill={[C.red, C.gold, C.green][i]} />)}
              </Bar>
              <Bar dataKey="lossRatio" name="S/P %" fill={C.blue} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </section>
  );
}

/* ============================================================
   SENSIBILITÉ — sliders + impacts immédiats + heatmap
   ============================================================ */
const heatColor = (v, min, max) => {
  if (max === min) return C.gold;
  const t = (v - min) / (max - min); // 0 = pire, 1 = meilleur
  // rouge -> or -> vert
  const lerp = (a, b) => Math.round(a + (b - a) * t);
  const c1 = t < 0.5 ? [185, 58, 50] : [176, 138, 62];
  const c2 = t < 0.5 ? [176, 138, 62] : [30, 138, 95];
  const tt = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const rgb = c1.map((x, i) => Math.round(x + (c2[i] - x) * tt));
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
};

export function SensibiliteSection({ x, lang, badges, assumptions }) {
  const [freq, setFreq] = useState(1);
  const [price, setPrice] = useState(1);
  const [insured, setInsured] = useState(1);
  const [indemnity, setIndemnity] = useState(1);
  const [drought, setDrought] = useState(1);

  const mult = useMemo(() => ({
    freq: freq * drought,
    premium: price,
    insured,
    indemnity,
  }), [freq, price, insured, indemnity, drought]);

  const rows = useMemo(() => projectYears(assumptions, mult), [assumptions, mult]);
  const net5 = rows.reduce((s, r) => s + r.resultNet, 0);
  const roiV = roi(rows, assumptions.initialInvestment);
  const npvV = npv(assumptions, rows);
  const irrV = irr(assumptions, rows);

  const freqRange = [0.6, 0.8, 1, 1.2, 1.4, 1.6];
  const indemRange = [0.6, 0.8, 1, 1.2, 1.4];
  const heat = useMemo(() => sensitivityHeatmap(assumptions, freqRange, indemRange), [assumptions]); // eslint-disable-line
  const heatMin = Math.min(...heat.map((h) => h.net));
  const heatMax = Math.max(...heat.map((h) => h.net));

  /* Impact du déficit pluviométrique sur l'indemnisation (taux) */
  const deficitData = useMemo(() => {
    const pts = [];
    for (let d = 0; d <= 60; d += 5) {
      const rate = d < 10 ? 0 : d < 20 ? 25 : d < 35 ? 50 : d < 50 ? 75 : 100;
      pts.push({ deficit: d, rate });
    }
    return pts;
  }, []);

  const sliders = [
    [x.params.freq, freq, setFreq], [x.params.price, price, setPrice],
    [x.params.insured, insured, setInsured], [x.params.indemnity, indemnity, setIndemnity],
    [x.params.drought, drought, setDrought],
  ];

  return (
    <section id="sensibilite" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
          <div className="mt-2"><DataBadge type="simulation" labels={badges} /></div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 mb-8">
          <Card className="lg:col-span-2 h-fit">
            {sliders.map(([label, val, set], i) => (
              <div key={i} className="mb-5">
                <div className="flex justify-between text-xs font-semibold mb-2" style={{ color: C.navy }}>
                  <span>{label}</span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: C.blueSoft, color: C.blue }}>×{val.toFixed(2)}</span>
                </div>
                <input type="range" min={0.5} max={1.8} step={0.05} value={val}
                  onChange={(e) => set(Number(e.target.value))} className="w-full"
                  style={{ "--val": `${((val - 0.5) / 1.3) * 100}%` }} />
              </div>
            ))}
          </Card>
          <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4 content-start">
            {[
              [x.impacts.net, `${fmtCompact(net5, lang)} MRU`, net5],
              [x.impacts.roi, `${roiV.toFixed(1)} %`, roiV],
              [x.impacts.npv, `${fmtCompact(npvV, lang)} MRU`, npvV],
              [x.impacts.irr, irrV !== null ? `${irrV.toFixed(1)} %` : "—", irrV ?? 0],
            ].map(([label, v, raw], i) => (
              <Card key={i} className="!p-5">
                <div className="text-xs mb-1.5" style={{ color: C.slateLight }}>{label}</div>
                <div className="text-2xl font-extrabold" style={{ color: raw >= 0 ? C.green : C.red, fontFamily: "var(--font-display)" }}>{v}</div>
              </Card>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <Card className="mb-6">
          <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.heatTitle}</div>
          <div className="overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="grid" style={{ gridTemplateColumns: `120px repeat(${freqRange.length}, 1fr)` }}>
                <div />
                {freqRange.map((f) => (
                  <div key={f} className="text-center text-[11px] font-semibold pb-2" style={{ color: C.slate }}>×{f}</div>
                ))}
                {indemRange.map((im) => (
                  <React.Fragment key={im}>
                    <div className="text-[11px] font-semibold flex items-center pe-2 justify-end" style={{ color: C.slate }}>×{im}</div>
                    {freqRange.map((f) => {
                      const cell = heat.find((h) => h.freq === f && h.indemnity === im);
                      return (
                        <div key={f} className="m-0.5 rounded-lg py-3 text-center text-[11px] font-bold text-white transition-transform hover:scale-[1.03]"
                          style={{ backgroundColor: heatColor(cell.net, heatMin, heatMax) }}
                          title={`${fmtNumber(cell.net, lang)} MRU`}>
                          {fmtCompact(cell.net, lang)}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between text-[10px] mt-2" style={{ color: C.slateLight }}>
                <span>{x.heatY} ↕</span><span>{x.heatX} →</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.deficitChart}</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={deficitData}>
              <defs>
                <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.orange} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.orange} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="deficit" tick={{ fontSize: 10 }} unit="%" />
              <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
              <Tooltip formatter={(v) => `${v} %`} />
              <Area type="stepAfter" dataKey="rate" stroke={C.orange} fill="url(#defGrad)" strokeWidth={2} name="%" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </section>
  );
}
