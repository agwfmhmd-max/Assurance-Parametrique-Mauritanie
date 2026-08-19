import React from "react";
import { Linkedin, CheckCircle2, AlertTriangle, UserRound } from "lucide-react";
import { C, Card, SectionTitle, DataBadge } from "./shared";

/* ============================================================
   ÉQUIPE — cartes premium avec animation au survol
   ============================================================ */
export function TeamSection({ x, team, badges }) {
  return (
    <section id="equipe" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <SectionTitle eyebrow={x.eyebrow} title={x.title} desc={x.desc} />
        <div className="mt-2"><DataBadge type="hypothese" labels={badges} /></div>
      </div>
      {(!team || team.length === 0) ? (
        <Card className="text-center py-12"><p className="text-sm" style={{ color: C.slate }}>{x.noMembers}</p></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((m) => (
            <div key={m.id} className="team-card group relative rounded-2xl overflow-hidden border shadow-[0_1px_2px_rgba(11,30,57,0.05),0_14px_34px_-20px_rgba(11,30,57,0.25)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_56px_-20px_rgba(11,30,57,0.4)]"
              style={{ borderColor: C.border, backgroundColor: C.white }}>
              {/* photo */}
              <div className="relative h-56 overflow-hidden" style={{ background: `linear-gradient(150deg, ${C.navyLight}, ${C.navyDeep})` }}>
                {m.photo_url ? (
                  <img src={m.photo_url} alt={`${m.first_name} ${m.last_name}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UserRound size={72} color="rgba(217,188,122,0.55)" />
                  </div>
                )}
                <div className="absolute inset-0 transition-opacity duration-500 opacity-0 group-hover:opacity-100"
                  style={{ background: `linear-gradient(180deg, transparent 30%, ${C.navyDeep}E8)` }} />
                {/* rôle au survol */}
                <div className="absolute bottom-0 inset-x-0 p-4 translate-y-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: C.goldLight }}>{x.role}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{m.role}</div>
                </div>
              </div>
              {/* infos */}
              <div className="p-5">
                <div className="font-bold text-base" style={{ color: C.navy }}>{m.first_name} {m.last_name}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: C.gold }}>{m.function}</div>
                <div className="text-[11px] mt-1" style={{ color: C.slateLight }}>{m.specialty}</div>
                <p className="text-xs leading-relaxed mt-3 line-clamp-3" style={{ color: C.slate }}>{m.bio}</p>
                {m.linkedin && (
                  <a href={m.linkedin} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold mt-3 transition-colors hover:opacity-80"
                    style={{ color: C.blue }}>
                    <Linkedin size={14} /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ============================================================
   CONCLUSION
   ============================================================ */
export function ConclusionSection({ x, lang }) {
  return (
    <section id="conclusion" className="relative py-16 md:py-20 overflow-hidden" style={{ backgroundColor: C.navyDeep }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${C.navyDeep} 0%, ${C.navy} 55%, ${C.navyLight} 100%)` }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(40rem 22rem at 88% 8%, rgba(176,138,62,0.14), transparent 62%)" }} />
      <div className="max-w-5xl mx-auto px-4 md:px-8 relative">
        <SectionTitle eyebrow={x.eyebrow} title={x.title} light />
        <div className="rounded-2xl p-6 md:p-8 border mb-8"
          style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.05)", backdropFilter: "blur(8px)" }}>
          <p className="text-base md:text-lg leading-relaxed" style={{ color: "#D7E0EE" }}>{x.text}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {x.points.map((p, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl p-4 border"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(255,255,255,0.04)" }}>
              <CheckCircle2 size={17} className="shrink-0 mt-0.5" style={{ color: C.goldLight }} />
              <span className="text-sm leading-relaxed" style={{ color: "#C3CFE0" }}>{p}</span>
            </div>
          ))}
        </div>
        <div className="flex items-start gap-2 text-xs italic" style={{ color: "#8FA0BE" }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: C.gold }} /> {x.limits}
        </div>
      </div>
    </section>
  );
}
