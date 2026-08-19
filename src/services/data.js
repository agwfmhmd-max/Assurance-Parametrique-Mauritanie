import { supabase } from "../lib/supabaseClient";
import { DEFAULT_ASSUMPTIONS } from "../finance/engine";

/* ============================================================
   COUCHE DE DONNÉES — Supabase d'abord, localStorage en repli.
   - Lecture publique : site_settings, financial_assumptions, team_members
   - Écriture : réservée aux administrateurs authentifiés (RLS)
   ============================================================ */

const LS = {
  assumptions: "apc_financial_assumptions",
  team: "apc_team_members",
  settings: "apc_site_settings",
  edits: "apc_edit_log",
};

export const isSupabaseConfigured = () =>
  !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* quota */ }
}

export function logEdit(label) {
  const log = lsGet(LS.edits, []);
  log.unshift({ label, at: new Date().toISOString() });
  lsSet(LS.edits, log.slice(0, 20));
}
export function getEditLog() { return lsGet(LS.edits, []); }

/* ---------------- Hypothèses financières ---------------- */
export async function loadAssumptions() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("financial_assumptions").select("assumptions")
      .eq("id", 1).maybeSingle();
    if (error) throw new Error(`FINANCE_LOAD_FAILED: ${error.message}`);
    return { ...DEFAULT_ASSUMPTIONS, ...(data?.assumptions || {}) };
  }
  return { ...DEFAULT_ASSUMPTIONS, ...lsGet(LS.assumptions, {}) };
}

export async function saveAssumptions(assumptions, authed) {
  if (isSupabaseConfigured()) {
    if (!authed) throw new Error("ADMIN_SESSION_REQUIRED");
    const { error } = await supabase.from("financial_assumptions")
      .upsert({ id: 1, assumptions, updated_at: new Date().toISOString() });
    if (error) throw new Error(`FINANCE_SAVE_FAILED: ${error.message}`);
    lsSet(LS.assumptions, assumptions);
    logEdit("Hypothèses financières mises à jour");
    return loadAssumptions();
  }
  lsSet(LS.assumptions, assumptions);
  logEdit("Hypothèses financières mises à jour");
  return assumptions;
}

/* ---------------- Équipe ---------------- */
export const DEFAULT_TEAM = [
  { id: "d1", first_name: "Membre", last_name: "1", function: "Cheffe de projet", specialty: "Banque & Assurance", bio: "Coordination de l'étude de faisabilité et modélisation financière.", linkedin: "", role: "Coordination & modélisation", photo_url: "" },
  { id: "d2", first_name: "Membre", last_name: "2", function: "Analyste risques climatiques", specialty: "Climat & données", bio: "Analyse des indices climatiques et des seuils de déclenchement.", linkedin: "", role: "Étude technique", photo_url: "" },
  { id: "d3", first_name: "Membre", last_name: "3", function: "Chargé d'étude marché", specialty: "Finance rurale", bio: "Analyse du marché agricole et pastoral mauritanien.", linkedin: "", role: "Étude de marché", photo_url: "" },
];

export async function loadTeam() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(`TEAM_LOAD_FAILED: ${error.message}`);
    return data || [];
  }
  const local = lsGet(LS.team, null);
  return local || DEFAULT_TEAM;
}

export async function saveTeamMember(member, authed) {
  if (isSupabaseConfigured()) {
    if (!authed) throw new Error("ADMIN_SESSION_REQUIRED");
    const row = {
      first_name: String(member.first_name || "").trim(),
      last_name: String(member.last_name || "").trim(),
      function: member.function || "", specialty: member.specialty || "",
      bio: member.bio || "", linkedin: member.linkedin || "", role: member.role || "",
      photo_url: member.photo_url || "",
      sort_order: Number.isFinite(Number(member.sort_order)) ? Number(member.sort_order) : 0,
      updated_at: new Date().toISOString(),
    };
    if (!row.first_name || !row.last_name) throw new Error("TEAM_MEMBER_NAME_REQUIRED");
    if (member.id && !String(member.id).startsWith("d") && !String(member.id).startsWith("local-")) row.id = member.id;
    const { error } = await supabase.from("team_members").upsert(row, { onConflict: "id" });
    if (error) throw new Error(`TEAM_SAVE_FAILED: ${error.message}`);
    const fresh = await loadTeam();
    lsSet(LS.team, fresh);
    logEdit(member.id ? `Membre modifié : ${member.first_name} ${member.last_name}` : `Membre ajouté : ${member.first_name} ${member.last_name}`);
    return fresh;
  }
  const team = await loadTeam();
  const idx = team.findIndex((m) => m.id === member.id);
  const next = idx >= 0 ? team.map((m, i) => (i === idx ? member : m)) : [...team, member];
  lsSet(LS.team, next);
  logEdit(idx >= 0 ? `Membre modifié : ${member.first_name} ${member.last_name}` : `Membre ajouté : ${member.first_name} ${member.last_name}`);
  return next;
}

export async function deleteTeamMember(id, authed) {
  if (isSupabaseConfigured()) {
    if (!authed) throw new Error("ADMIN_SESSION_REQUIRED");
    if (!id || String(id).startsWith("d") || String(id).startsWith("local-")) throw new Error("TEAM_MEMBER_ID_INVALID");
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) throw new Error(`TEAM_DELETE_FAILED: ${error.message}`);
    const fresh = await loadTeam();
    lsSet(LS.team, fresh); logEdit("Membre supprimé");
    return fresh;
  }
  const team = (await loadTeam()).filter((m) => m.id !== id);
  lsSet(LS.team, team); logEdit("Membre supprimé"); return team;
}

/* Upload photo : Supabase Storage si configuré, sinon dataURL compressée */
export async function uploadMemberPhoto(file, authed) {
  const dataUrl = await compressImage(file, 512);
  if (isSupabaseConfigured() && authed) {
    try {
      const path = `members/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
      const { error } = await supabase.storage.from("team-photos").upload(path, file, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("team-photos").getPublicUrl(path);
        return data.publicUrl;
      }
    } catch { /* fallback dataURL */ }
  }
  return dataUrl;
}

function compressImage(file, maxSize = 512) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => resolve("");
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- Paramètres du site ---------------- */
export async function loadSiteSettings() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("site_settings").select("settings").eq("id", 1).maybeSingle();
      if (!error && data?.settings) return data.settings;
    } catch { /* fallback */ }
  }
  return lsGet(LS.settings, null);
}
export async function saveSiteSettings(settings, authed) {
  lsSet(LS.settings, settings);
  logEdit("Informations générales mises à jour");
  if (isSupabaseConfigured() && authed) {
    try {
      await supabase.from("site_settings").upsert({ id: 1, settings, updated_at: new Date().toISOString() });
    } catch { /* local */ }
  }
}
