import React, { useState, useEffect, useRef } from "react";
import { X, Lock, LogOut, Save, Plus, Trash2, Pencil, Users, Settings2, LayoutDashboard, FileText, Upload } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { C, Card } from "./shared";
import Logo from "./Logo";
import { DEFAULT_ASSUMPTIONS } from "../finance/engine";
import {
  isSupabaseConfigured, loadTeam, saveTeamMember, deleteTeamMember,
  uploadMemberPhoto, saveSiteSettings, getEditLog, loadSiteSettings,
} from "../services/data";

/* ============================================================
   ESPACE SUPERVISEUR
   - Ouverture : 5 clics rapides sur le logo (géré par le parent)
   - Auth : Supabase Auth (email + mot de passe, session persistante)
   - Repli local (mode démo) si Supabase n'est pas configuré
   ============================================================ */
export default function AdminPanel({ open, onClose, lang, x, assumptions, onSaveAssumptions, team, onTeamChange, dir }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("overview");
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [configured]);

  useEffect(() => { if (open) { setDraft({ ...assumptions }); setSaved(false); setAuthError(null); setActionError(null); } }, [open]); // eslint-disable-line

  if (!open) return null;
  const authed = !!session;

  async function handleLogin(e) {
    e.preventDefault();
    setBusy(true); setAuthError(null);
    if (!configured) { setBusy(false); setAuthError(x.notConfigured); return; }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setAuthError(x.wrongCreds);
  }

  async function handleLogout() {
    if (configured) await supabase.auth.signOut();
    setSession(null);
  }

  async function handleSaveAssumptions() {
    try { setActionError(null); await onSaveAssumptions(draft, authed); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch (err) { setActionError(err?.message || "SAVE_FAILED"); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-6" dir={dir}>
      <div className="absolute inset-0" style={{ backgroundColor: "rgba(6,15,31,0.72)", backdropFilter: "blur(6px)" }} onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-2xl" style={{ backgroundColor: C.ivory }}>
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
            <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-black/5" style={{ color: C.navy }} aria-label={x.close}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* LOGIN */}
        {!authed && (
          <div className="px-5 md:px-7 py-10 max-w-md mx-auto">
            {!configured && (
              <div className="rounded-xl border p-4 mb-6 text-xs leading-relaxed" style={{ borderColor: `${C.orange}55`, backgroundColor: C.orangeSoft, color: C.orange }}>
                {x.notConfigured}
              </div>
            )}
            <form onSubmit={handleLogin} className="bg-white rounded-2xl border p-6 shadow-sm" style={{ borderColor: C.border }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}>
                <Lock size={18} color={C.goldLight} />
              </div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{x.email}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="input-polished w-full border rounded-lg px-3 py-2.5 text-sm mb-4" style={{ borderColor: C.border }} />
              <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{x.password}</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="input-polished w-full border rounded-lg px-3 py-2.5 text-sm mb-4" style={{ borderColor: C.border }} />
              {authError && <p className="text-xs font-medium mb-4" style={{ color: C.red }}>{authError}</p>}
              <button type="submit" disabled={busy}
                className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})` }}>
                {busy ? x.loggingIn : x.login}
              </button>
              <p className="text-[11px] mt-4 text-center" style={{ color: C.slateLight }}>{x.adminHint}</p>
            </form>
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
              <FinanceEditor x={x} draft={draft} setDraft={setDraft} onSave={handleSaveAssumptions} saved={saved} lang={lang} fx={x} />
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
  return (
    <Card>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {Object.keys(fx.hyp).map((k) => (
          <div key={k}>
            <label className="text-xs font-semibold block mb-1.5" style={{ color: C.navy }}>{fx.hyp[k]}</label>
            <input type="number" value={draft[k] ?? ""} onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) || 0 })}
              className="input-polished w-full border rounded-lg px-3 py-2 text-sm" style={{ borderColor: C.border }} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={onSave} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 transition-all hover:-translate-y-px"
          style={{ background: `linear-gradient(135deg, ${C.green}, #146644)` }}>
          <Save size={14} /> {saved ? fx.saved : (fx.save || "Save")}
        </button>
        <button onClick={() => setDraft({ ...DEFAULT_ASSUMPTIONS })} className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-black/5"
          style={{ borderColor: C.border, color: C.slate }}>
          {fx.reset}
        </button>
      </div>
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
