import React from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { C, Card, SectionTitle, DataBadge } from "./shared";
import { Sprout, Beef, Users, Shield, TrendingUp, Building2 } from "lucide-react";

const BLOCK_ICONS = [Sprout, Beef, Users, Shield, TrendingUp, Building2];

export default function MarcheSection({ x, lang, badges }) {
  const penData = [
    { name: x.penLabels[0], value: 2 },
    { name: x.penLabels[1], value: 6 },
    { name: x.penLabels[2], value: 92 },
  ];
  const marketData = [
    { name: x.marketLabels[0], value: 46 },
    { name: x.marketLabels[1], value: 27 },
    { name: x.marketLabels[2], value: 12 },
    { name: x.marketLabels[3], value: 15 },
  ];
  const pieColors = [C.green, C.blue, C.gold, C.blueLight];
  const swotColors = { s: C.green, w: C.orange, o: C.blue, th: C.red };

  return (
    <section id="marche" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
        <div className="mt-2"><DataBadge type="estimation" labels={badges} /></div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {x.blocks.map((b, i) => {
          const Icon = BLOCK_ICONS[i] || TrendingUp;
          return (
            <Card key={i}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: C.blueSoft }}>
                <Icon size={19} style={{ color: C.blue }} />
              </div>
              <div className="font-semibold text-sm mb-1.5" style={{ color: C.navy }}>{b.t}</div>
              <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{b.d}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.chartPen}</div>
          <ResponsiveContainer width="100%" height={230}>
            <PieChart>
              <Pie data={penData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ value }) => `${value}%`} labelLine={false}>
                {penData.map((_, i) => <Cell key={i} fill={[C.green, C.gold, C.slateLight][i]} />)}
              </Pie>
              <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{x.chartMarket}</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={marketData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {marketData.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* SWOT */}
      <h3 className="text-lg font-bold mb-4" style={{ color: C.navy }}>{x.swot.title}</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {["s", "w", "o", "th"].map((k) => (
          <Card key={k} className="border-t-4" style={{ borderTopColor: swotColors[k] }}>
            <div className="font-bold text-sm mb-3" style={{ color: swotColors[k] }}>{x.swot[k].t}</div>
            <ul className="space-y-2">
              {x.swot[k].items.map((it, i) => (
                <li key={i} className="text-xs flex items-start gap-2 leading-relaxed" style={{ color: C.slate }}>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: swotColors[k] }} /> {it}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </section>
  );
}
