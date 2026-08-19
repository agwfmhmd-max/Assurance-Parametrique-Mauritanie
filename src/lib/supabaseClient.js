import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and fill them in."
  );
}

// Only the anon (public) key is ever used in this frontend.
// The service_role key must NEVER appear in client code.
// Fall back to a placeholder so the app still mounts when env vars are
// absent (e.g. local preview) — the survey widget then shows its built-in
// error state instead of crashing the whole platform.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder-anon-key"
);
