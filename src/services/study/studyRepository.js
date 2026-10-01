import { supabase } from '../../lib/supabaseClient.js';
import { hashStudyState } from './studyState.js';
import { isSupabaseConfigured } from '../data.js';

export async function saveClimateRecords(records, authed = false) {
  if (!isSupabaseConfigured() || !authed || !records?.length) return { saved: false };
  const { error } = await supabase.from('climate_data').insert(records.map(r => ({
    wilaya: r.wilaya, latitude: r.latitude, longitude: r.longitude, date: r.date, variable: r.variable, value: r.value, unit: r.unit,
    source: r.source, source_url: r.sourceUrl, dataset: r.dataset, data_type: r.dataType, quality_status: r.qualityStatus, retrieved_at: r.retrievedAt,
  })));
  if (error) throw error; return { saved: true };
}

export async function saveStudyVersion(studyState, userId = null) {
  if (!userId && isSupabaseConfigured()) { const { data } = await supabase.auth.getUser(); userId = data?.user?.id || null; }
  const dataHash = hashStudyState(studyState);
  if (!isSupabaseConfigured()) return { id: null, version: studyState.metadata.version, dataHash };
  const { data, error } = await supabase.from('study_versions').insert({ version: studyState.metadata.version, study_state: studyState, created_by: userId, data_hash: dataHash }).select('id,version,data_hash').single();
  if (error) throw error; return { id: data.id, version: data.version, dataHash: data.data_hash };
}
