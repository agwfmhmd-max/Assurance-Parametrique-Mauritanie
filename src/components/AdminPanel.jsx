import React, { useState, useEffect, useRef, useMemo } from "react";
import { X, Lock, LogOut, Save, Plus, Trash2, Pencil, Users, Settings2, LayoutDashboard, FileText, Upload, Eye, EyeOff, ArrowLeft, ShieldCheck, CloudRain, BarChart3, Volume2, VolumeX } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { C, Card } from "./shared";
import Logo from "./Logo";
import { DEFAULT_ASSUMPTIONS } from "../finance/engine";
import { PLAYFUL_GATE } from "../config";
import { playLaughSound } from "../lib/laughSound";
import {
  isSupabaseConfigured, loadTeam, saveTeamMember, deleteTeamMember,
  uploadMemberPhoto, saveSiteSettings, getEditLog, loadSiteSettings,
} from "../services/data";

const GATE_CONFETTI_COLORS = [C.gold, C.goldLight, C.blue, C.green, C.orange];

/* بطاقة الجسيمات (كونفيتي) الخفيفة — بدون مكتبات خارجية */
function GateConfetti() {
  const pieces = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: 4 + Math.random() * 92,
    delay: Math.random() * 0.25,
    duration: 1.1 + Math.random() * 0.8,
    color: GATE_CONFETTI_COLORS[i % GATE_CONFETTI_COLORS.length],
  })), []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden="true">
      {pieces.map((p) => (
        <span key={p.id} className="gate-confetti-piece"
          style={{ left: `${p.left}%`, backgroundColor: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
      ))}
    </div>
  );
}

/* ============================================================
   ESPACE SUPERVISEUR
   - Ouverture : 5 clics rapides sur le logo (géré par le parent)
   - Auth : Supabase Auth (email + mot de passe, session persistante)
   - Repli local (mode démo) si Supabase n'est pas configuré
   ============================================================ */
export default function AdminPanel({ open, onClose, onLangChange, lang, x, finance, assumptions, onSaveAssumptions, team, onTeamChange, dir, gateMode = false, onAuthenticated, onUnauthenticated }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("overview");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [gateStep, setGateStep] = useState(gateMode ? "question" : "login");
  const [laughLineIdx, setLaughLineIdx] = useState(0);
  const [gateMuted, setGateMuted] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("apc-gate-muted") === "1" : false));
  const configured = isSupabaseConfigured();

  function toggleGateMute() {
    setGateMuted((m) => {
      const next = !m;
      try { localStorage.setItem("apc-gate-muted", next ? "1" : "0"); } catch { /* noop */ }
      return next;
    });
  }

  function triggerLaughScreen(step, linesPool) {
    if (Array.isArray(linesPool) && linesPool.length > 0) {
      setLaughLineIdx(Math.floor(Math.random() * linesPool.length));
    }
    if (PLAYFUL_GATE) playLaughSound(gateMuted);
    setGateStep(step);
  }

  const verifyAdminSession = async (nextSession) => {
    if (!nextSession?.user?.id || !configured) {
      setIsAdmin(false);
      setCheckingAdmin(false);
      return false;
    }
    setCheckingAdmin(true);
    const { data, error } = await supabase
      .from("admin_profiles")
      .select("user_id")
      .eq("user_id", nextSession.user.id)
      .maybeSingle();
    const allowed = !error && !!data?.user_id;
    setIsAdmin(allowed);
    setCheckingAdmin(false);
    if (allowed && onAuthenticated) onAuthenticated(nextSession);
    return allowed;
  };

  useEffect(() => {
    if (!configured) { setCheckingAdmin(false); return; }
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        const allowed = await verifyAdminSession(data.session);
        if (!allowed && active) {
          await supabase.auth.signOut();
          setSession(null);
        }
      } else {
        setIsAdmin(false);
        setCheckingAdmin(false);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!active) return;
      setSession(s);
      if (!s) { setIsAdmin(false); setCheckingAdmin(false); if (onUnauthenticated) onUnauthenticated(); return; }
      const allowed = await verifyAdminSession(s);
      if (!allowed && active) {
        await supabase.auth.signOut();
        setSession(null);
      }
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [configured]);

  useEffect(() => { if (open) { setDraft({ ...assumptions }); setSaved(false); setAuthError(null); setActionError(null); setShowPassword(false); setRememberDevice(localStorage.getItem("apc-remember-device") !== "0"); setGateStep(gateMode ? "question" : "login"); } }, [open, gateMode]); // eslint-disable-line

  if (!open) return null;
  const authed = !!session && isAdmin && !checkingAdmin;

  // بوابة الدخول الأولى: سؤال صريح قبل عرض نموذج تسجيل الدخول.
  if (gateMode && !authed && !checkingAdmin && gateStep === "question") {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" dir={dir}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${C.navyLight}, ${C.navyDeep} 62%, #020812)`, backdropFilter: "blur(8px)" }} />
        <div className="relative w-full max-w-xl rounded-3xl border p-6 sm:p-9 shadow-2xl" style={{ backgroundColor: "rgba(255,255,255,0.98)", borderColor: `${C.gold}55` }}>
          <button type="button" onClick={onLangChange} className="absolute top-4 end-4 rounded-full border px-3 py-1.5 text-[11px] font-bold" style={{ borderColor: C.border, color: C.blue }}>{lang === "fr" ? "العربية" : "Français"}</button>
          <div className="flex justify-center mb-5">
            <Logo variant="compact" theme="dark" size={54} />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4"><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.blue}16`, color: C.blue }}><CloudRain size={18} /></span><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.gold}18`, color: C.gold }}><BarChart3 size={18} /></span><span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${C.green}18`, color: C.green }}><ShieldCheck size={18} /></span></div>
            <div className="text-[11px] font-bold tracking-[0.18em] uppercase mb-3" style={{ color: C.gold }}>{x.accessGate.eyebrow}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-2" style={{ color: C.slateLight }}>{lang === "ar" ? "المناخ · التأمين · المالية · البحث" : "Climate Risk · Insurance · Finance · Research"}</div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>
              {x.accessGate.title}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed mb-7" style={{ color: C.slate }}>{x.accessGate.desc}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <button type="button" onClick={() => setGateStep("login")}
                className="py-3.5 px-5 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg"
                style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}>
                {x.accessGate.yes}
              </button>
              <button type="button" onClick={() => triggerLaughScreen("no", x.accessGate.laughLines)}
                className="py-3.5 px-5 rounded-xl text-sm font-bold border transition-all hover:-translate-y-px hover:bg-black/5"
                style={{ borderColor: C.border, color: C.slate }}>
                {x.accessGate.no}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authed && !checkingAdmin && (gateStep === "no" || gateStep === "wrongpass")) {
    const isWrongPass = gateStep === "wrongpass";
    const linesPool = isWrongPass ? x.accessGate.wrongPassLines : x.accessGate.laughLines;
    const line = (Array.isArray(linesPool) && linesPool[laughLineIdx]) || linesPool?.[0] || x.wrongCreds;
    const backTarget = isWrongPass ? "login" : "question";
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" dir={dir}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 0%, ${C.navyLight}, ${C.navyDeep} 62%, #020812)` }} />
        <div className="relative w-full max-w-lg rounded-3xl border p-7 sm:p-9 shadow-2xl text-center overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.98)", borderColor: `${C.gold}55` }}>
          {PLAYFUL_GATE && <GateConfetti />}
          <div className="relative flex items-center justify-between mb-2">
            <button type="button" onClick={toggleGateMute}
              className="rounded-full border w-8 h-8 flex items-center justify-center"
              style={{ borderColor: C.border, color: C.slate }}
              aria-label={gateMuted ? x.accessGate.unmuteLabel : x.accessGate.muteLabel}
              title={gateMuted ? x.accessGate.unmuteLabel : x.accessGate.muteLabel}>
              {gateMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={onLangChange} className="rounded-full border px-3 py-1.5 text-[11px] font-bold" style={{ borderColor: C.border, color: C.blue }}>{lang === "fr" ? "العربية" : "Français"}</button>
              {!gateMode && (
                <button type="button" onClick={onClose} className="rounded-full border w-8 h-8 flex items-center justify-center" style={{ borderColor: C.border, color: C.slate }} aria-label={x.close}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="relative text-6xl mb-5 gate-emoji-pop">
            <span className="inline-block gate-emoji-wiggle" role="img" aria-label="laughing">{isWrongPass ? "🔐😂" : "🤣"}</span>
          </div>
          <div className="relative text-xl sm:text-2xl font-extrabold mb-7 leading-snug gate-text-in" style={{ color: C.navy }}>
            {line}
          </div>
          <div className="relative flex flex-col sm:flex-row gap-3 justify-center">
            <button type="button" onClick={() => triggerLaughScreen(gateStep, linesPool)}
              className="py-3 px-6 rounded-xl text-sm font-bold border transition-all hover:-translate-y-px hover:bg-black/5"
              style={{ borderColor: C.border, color: C.slate }}>
              {x.accessGate.retry}
            </button>
            <button type="button" onClick={() => setGateStep(backTarget)}
              className="py-3 px-6 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}>
              {x.accessGate.back}
            </button>
          </div>
        </div>
      </div>
    );
  }

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true); setAuthError(null);
    if (!configured) { setBusy(false); setAuthError(x.notConfigured); return; }
    if (rememberDevice) localStorage.setItem("apc-remember-device", "1");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      if (PLAYFUL_GATE) {
        setPassword("");
        triggerLaughScreen("wrongpass", x.accessGate.wrongPassLines);
      } else {
        setAuthError(x.wrongCreds);
      }
      return;
    }
    if (data.session) {
      const allowed = await verifyAdminSession(data.session);
      if (!allowed) {
        await supabase.auth.signOut();
        setSession(null);
        if (PLAYFUL_GATE) {
          setPassword("");
          triggerLaughScreen("wrongpass", x.accessGate.wrongPassLines);
        } else {
          setAuthError(x.notAdmin || "ليس لديك صلاحية المشرف / Vous n'avez pas les droits administrateur.");
        }
        return;
      }
      setSession(data.session);
    }
  }

  async function handleLogout() {
    if (configured) await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
    setCheckingAdmin(false);
    if (onUnauthenticated) onUnauthenticated();
  }

  async function handleSaveAssumptions() {
    try { setActionError(null); await onSaveAssumptions(draft, authed); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch (err) { setActionError(err?.message || "SAVE_FAILED"); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6" dir={dir}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(6,15,31,0.72)", backdropFilter: "blur(6px)" }} onClick={onClose} />
        <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl" style={{ backgroundColor: C.ivory }}>
        <button type="button" onClick={onLangChange} className="absolute top-4 end-16 z-20 rounded-full border px-3 py-1.5 text-[11px] font-bold" style={{ borderColor: C.border, color: C.blue, background: C.white }}>{lang === "fr" ? "العربية" : "Français"}</button>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 md:px-7 py-4 border-b"
          style={{ backgroundColor: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", borderColor: C.border }}>
          <div className="flex items-center gap-3">
            <Logo variant="compact" theme="dark" size={34} />
            <div>
              <div className="font-bold text-sm" style={{ color: C.navy }}>{authed ? x.panel : x.loginTitle}</div>
              <div className="text-[11px]" style={{ color: C.slateLight }}>
                {authed ? `${x.sessionActive} · ${session.user.email}` : x.loginDesc}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {authed && (
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors hover:bg-black/5"
                style={{ borderColor: C.border, color: C.slate }}>
                <LogOut size={13} /> {x.logout}
              </button>
            )}
            {!gateMode && (
            <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-black/5" style={{ color: C.navy }} aria-label={x.close}>
              <X size={18} />
            </button>
          )}
          </div>
        </div>

        {/* CHECKING ADMIN */}
        {!authed && checkingAdmin && configured && (
          <div className="px-5 md:px-7 py-14 max-w-md mx-auto text-center">
            <Lock size={28} className="mx-auto mb-3" style={{ color: C.gold }} />
            <p className="text-sm font-semibold" style={{ color: C.navy }}>
              {x.checkingAdmin || "Vérification des autorisations…"}
            </p>
          </div>
        )}

        {/* LOGIN */}
        {!authed && !checkingAdmin && (
          <div className="px-5 md:px-7 py-8 max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-stretch">
            <div className="hidden lg:flex rounded-2xl p-6 flex-col justify-between" style={{ background: `linear-gradient(145deg, ${C.navyDeep}, ${C.navyLight})`, color: C.white }}><div><div className="flex items-center gap-2 mb-5"><Logo variant="compact" theme="dark" size={42} /><span className="font-bold text-sm">APC · Mauritanie</span></div><div className="text-[10px] uppercase tracking-[0.18em] font-bold mb-3" style={{ color: C.goldLight }}>{lang === "ar" ? "تجربة أكاديمية متقدمة" : "Premium Academic Experience"}</div><h2 className="text-2xl font-bold leading-tight" style={{ fontFamily: "var(--font-display)" }}>{lang === "ar" ? "ذكاء المخاطر المناخية من أجل موريتانيا قادرة على الصمود." : "Intelligence des risques climatiques pour une Mauritanie résiliente."}</h2><p className="text-xs leading-relaxed mt-4" style={{ color: "#B9C6DA" }}>{lang === "ar" ? "تحليل تقني ومالي وأكاديمي لآليات التأمين التأشيري في قطاعي الزراعة وتربية الماشية." : "Analyse technique, financière et académique des mécanismes paramétriques pour l'agriculture et l'élevage."}</p></div><div className="grid grid-cols-3 gap-2 text-[10px]" style={{ color: "#B9C6DA" }}><span className="rounded-lg border p-2" style={{ borderColor: "rgba(255,255,255,.14)" }}>{lang === "ar" ? "بيانات" : "Data"}</span><span className="rounded-lg border p-2" style={{ borderColor: "rgba(255,255,255,.14)" }}>{lang === "ar" ? "مخاطر" : "Risk"}</span><span className="rounded-lg border p-2" style={{ borderColor: "rgba(255,255,255,.14)" }}>{lang === "ar" ? "مالية" : "Finance"}</span></div></div>
            <div>
            {!configured && (
              <div className="rounded-xl border p-4 mb-6 text-xs leading-relaxed" style={{ borderColor: `${C.orange}55`, backgroundColor: C.orangeSoft, color: C.orange }}>
                {x.notConfigured}
              </div>
            )}
            <form onSubmit={handleLogin} className="bg-white rounded-2xl border p-6 sm:p-7 shadow-sm" style={{ borderColor: C.border }}>
              <button type="button" onClick={() => gateMode ? setGateStep("question") : onClose()} className="text-xs font-semibold flex items-center gap-1.5 mb-4" style={{ color: C.slate }}><ArrowLeft size={14} className={dir === "rtl" ? "rotate-180" : ""} /> {x.accessGate?.back || "Retour"}</button>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}><Lock size={18} color={C.goldLight} /></div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{x.email}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-polished w-full border rounded-lg px-3 py-2.5 text-sm mb-4" style={{ borderColor: C.border }} />
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{x.password}</label>
              <div className="relative mb-3"><input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-polished w-full border rounded-lg px-3 py-2.5 pe-11 text-sm" style={{ borderColor: C.border }} /><button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md" style={{ color: C.slate }} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div>
              <label className="flex items-center gap-2 text-xs mb-4" style={{ color: C.slate }}><input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} /> {x.remember || (lang === "ar" ? "تذكر هذا الجهاز" : "Se souvenir de cet appareil")}</label>
              {authError && <p className="text-xs font-medium mb-4 rounded-lg px-3 py-2" style={{ color: C.red, background: C.redSoft }}>{authError}</p>}
              <button type="submit" disabled={busy}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}>
                {busy ? x.loggingIn : x.login}
              </button>
              <p className="text-[11px] mt-4 text-center" style={{ color: C.slateLight }}>{x.adminHint}</p>
            </form>
            </div>
            </div>
          </div>
        )}

        {/* DASHBOARD ADMIN */}
        {authed && (
          <div className="px-5 md:px-7 py-6">
            {actionError && <div className="rounded-xl border px-4 py-3 mb-5 text-xs font-semibold" style={{ borderColor: `${C.red}55`, backgroundColor: `${C.red}0D`, color: C.red }}>{actionError}</div>}
            {!configured && (
              <div className="rounded-xl border px-4 py-2.5 mb-5 text-xs font-semibold inline-block" style={{ borderColor: `${C.gold}55`, backgroundColor: "#F7F0E0", color: C.gold }}>
                {x.demoMode}
              </div>
            )}
            <div className="flex flex-wrap gap-2 mb-6">
              {[[ "overview", x.tabs.overview, LayoutDashboard ], ["finance", x.tabs.finance, Settings2], ["team", x.tabs.team, Users], ["site", x.tabs.site, FileText]].map(([k, label, Icon]) => (
                <button key={k} onClick={() => setTab(k)}
                  className="px-4 py-2 rounded-full text-sm font-medium border flex items-center gap-2 transition-all duration-300"
                  style={tab === k
                    ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, borderColor: C.navy, color: C.white }
                    : { borderColor: C.border, color: C.slate, backgroundColor: C.white }}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {tab === "overview" && <AdminOverview x={x} team={team} lang={lang} />}
            {tab === "finance" && draft && (
              <FinanceEditor x={finance} draft={draft} setDraft={setDraft} onSave={handleSaveAssumptions} saved={saved} lang={lang} fx={finance} />
            )}
            {tab === "team" && <TeamEditor x={x} team={team} onChange={(t) => onTeamChange(t)} authed={authed} lang={lang} />}
            {tab === "site" && <SiteEditor x={x} authed={authed} />}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Vue d'ensemble ---------------- */
function AdminOverview({ x, team, lang }) {
  const edits = getEditLog();
  return (
    <div>
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[[x.stats.members, team.length], [x.stats.edits, edits.length], [x.stats.assumptions, Object.keys(DEFAULT_ASSUMPTIONS).length]].map(([label, v], i) => (
          <Card key={i} className="!p-5">
            <div className="text-2xl font-extrabold" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{v}</div>
            <div className="text-xs mt-1" style={{ color: C.slate }}>{label}</div>
          </Card>
        ))}
      </div>
      <Card>
        <div className="text-sm font-semibold mb-3" style={{ color: C.navy }}>{x.lastEdits}</div>
        {edits.length === 0 ? (
          <p className="text-xs" style={{ color: C.slateLight }}>{x.none}</p>
        ) : (
          <ul className="space-y-2">
            {edits.slice(0, 8).map((e, i) => (
              <li key={i} className="text-xs flex justify-between gap-3" style={{ color: C.slate }}>
                <span>{e.label}</span>
                <span style={{ color: C.slateLight }}>{new Date(e.at).toLocaleString(lang === "ar" ? "ar-MR" : "fr-FR")}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Éditeur des hypothèses ---------------- */
function FinanceEditor({ draft, setDraft, onSave, saved, fx }) {
  const [validation, setValidation] = useState("");
  const percentKeys = ["growthRate", "claimFreq", "distribRate", "reinsRate", "costInflation", "discountRate"];
  const validate = () => {
    for (const key of Object.keys(fx.hyp)) {
      const value = Number(draft[key]);
      if (!Number.isFinite(value) || value < 0) { setValidation("Les valeurs doivent être numériques et non négatives / يجب أن تكون القيم رقمية وغير سالبة."); return; }
      if (percentKeys.includes(key) && value > 100) { setValidation("Les pourcentages ne peuvent pas dépasser 100 % / لا يمكن أن تتجاوز النسب 100٪."); return; }
    }
    if (Number(draft.premiumAvg) < 0 || Number(draft.indemnityAvg) < 0) { setValidation("La prime et l'indemnité ne peuvent pas être négatives / لا يمكن أن يكون القسط أو التعويض سالبًا."); return; }
    setValidation("");
    onSave();
  };
  return (
    <Card>
      <div className="rounded-xl border p-4 mb-5" style={{ borderColor: `${C.blue}33`, background: C.blueSoft }}><div className="text-xs font-bold" style={{ color: C.navy }}>Data quality / جودة البيانات</div><div className="text-[11px] mt-1" style={{ color: C.slate }}>Les valeurs sont contrôlées avant sauvegarde : non-négativité, pourcentages ≤ 100 %, cohérence des hypothèses.</div></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.keys(fx.hyp).map((k) => (
          <div key={k}><label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{fx.hyp[k]}</label><input type="number" min="0" max={percentKeys.includes(k) ? "100" : undefined} value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) || 0 })} className="input-polished w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} /></div>
        ))}
      </div>
      {validation && <div className="rounded-lg px-3 py-2 mb-4 text-xs font-semibold" style={{ background: C.redSoft, color: C.red }}>{validation}</div>}
      <div className="flex flex-wrap gap-3"><button onClick={validate} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all hover:-translate-y-px" style={{ background: `linear-gradient(135deg, ${C.green}, #146644)` }}><Save size={14} /> {saved ? fx.saved : (fx.save || "Save")}</button><button onClick={() => { setValidation(""); setDraft({ ...DEFAULT_ASSUMPTIONS }); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-black/5" style={{ borderColor: C.border, color: C.slate }}>{fx.reset}</button></div>
    </Card>
  );
}

/* ---------------- Gestion de l'équipe ---------------- */
function TeamEditor({ x, team, onChange, authed }) {
  const empty = { id: "", first_name: "", last_name: "", function: "", specialty: "", bio: "", linkedin: "", role: "", photo_url: "" };
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function save() {
    try { setBusy(true); setError(null); const member = { ...form, id: form.id || `local-${Date.now()}` }; const next = await saveTeamMember(member, authed); onChange(next); setForm(null); }
    catch (err) { setError(err?.message || "TEAM_SAVE_FAILED"); }
    finally { setBusy(false); }
  }
  async function remove(id) {
    try { setBusy(true); setError(null); onChange(await deleteTeamMember(id, authed)); }
    catch (err) { setError(err?.message || "TEAM_DELETE_FAILED"); }
    finally { setBusy(false); }
  }
  async function pickPhoto(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = await uploadMemberPhoto(f, authed);
    setForm((p) => ({ ...p, photo_url: url }));
  }

  return (
    <div>
      {error && <div className="rounded-xl border px-4 py-3 mb-4 text-xs font-semibold" style={{ borderColor: `${C.red}55`, backgroundColor: `${C.red}0D`, color: C.red }}>{error}</div>}
      <div className="flex justify-end mb-4">
        <button onClick={() => setForm({ ...empty })} className="px-4 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2"
          style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}>
          <Plus size={14} /> {x.addMember}
        </button>
      </div>

      {form && (
        <Card className="mb-6">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[["first_name", x.memberForm.firstName], ["last_name", x.memberForm.lastName], ["function", x.memberForm.function], ["specialty", x.memberForm.specialty], ["role", x.memberForm.role], ["linkedin", x.memberForm.linkedin]].map(([k, label]) => (
              <div key={k}>
                <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{label}</label>
                <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  className="input-polished w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} />
              </div>
            ))}
          </div>
          <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{x.memberForm.bio}</label>
          <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
            className="input-polished w-full border rounded-lg px-3 py-2 text-sm mb-4" style={{ borderColor: C.border }} />
          <div className="flex items-center gap-4 mb-4">
            {form.photo_url && <img src={form.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover border" style={{ borderColor: C.border }} />}
            <button onClick={() => fileRef.current?.click()} className="px-4 py-2 rounded-lg text-xs font-semibold border flex items-center gap-2 transition-colors hover:bg-black/5"
              style={{ borderColor: C.border, color: C.blue }}>
              <Upload size={13} /> {x.uploadPhoto}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: `linear-gradient(135deg, ${C.green}, #146644)` }}>{x.confirm}</button>
            <button onClick={() => setForm(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border hover:bg-black/5" style={{ borderColor: C.border, color: C.slate }}>{x.cancel}</button>
          </div>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {team.map((m) => (
          <Card key={m.id} className="!p-4 flex items-center gap-4">
            {m.photo_url
              ? <img src={m.photo_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
              : <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.goldLight }}>{(m.first_name || "?")[0]}</div>}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: C.navy }}>{m.first_name} {m.last_name}</div>
              <div className="text-xs truncate" style={{ color: C.slate }}>{m.function}</div>
            </div>
            <button onClick={() => setForm({ ...m })} className="p-2 rounded-lg hover:bg-black/5" style={{ color: C.blue }} aria-label={x.editMember}><Pencil size={15} /></button>
            <button onClick={() => remove(m.id)} className="p-2 rounded-lg hover:bg-black/5" style={{ color: C.red }} aria-label={x.delMember}><Trash2 size={15} /></button>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Contenu du site ---------------- */
function SiteEditor({ x, authed }) {
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    loadSiteSettings().then((s) => setForm(s || {
      title: "Étude de faisabilité de la mise en place d'un système d'assurance paramétrique contre les risques climatiques en Mauritanie",
      subtitle: "Cas des secteurs agricole et de l'élevage",
      institution: "Institut Supérieur de Comptabilité et d'Administration des Entreprises",
      year: "2026",
    }));
  }, []);
  if (!form) return null;
  return (
    <Card className="max-w-2xl">
      {[["title", x.siteForm.title], ["subtitle", x.siteForm.subtitle], ["institution", x.siteForm.institution], ["year", x.siteForm.year]].map(([k, label]) => (
        <div key={k} className="mb-4">
          <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{label}</label>
          <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
            className="input-polished w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} />
        </div>
      ))}
      <button onClick={async () => { await saveSiteSettings(form, authed); setSaved(true); setTimeout(() => setSaved(false), 2500); }}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
        style={{ background: `linear-gradient(135deg, ${C.green}, #146644)` }}>
        <Save size={14} /> {saved ? x.saved : x.save}
      </button>
    </Card>
  );
}
