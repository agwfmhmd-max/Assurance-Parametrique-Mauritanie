import { hashStudyState } from '../study/studyState.js';
export function buildReportData(studyState) {
  const hash = hashStudyState(studyState);
  return {
    title: studyState.metadata.title,
    institution: studyState.metadata.institution,
    academicYear: studyState.metadata.academicYear,
    version: studyState.metadata.version,
    generatedAt: studyState.generatedAt,
    dataHash: hash,
    zone: studyState.simulator?.zone || studyState.zones?.[0]?.name || 'Non renseignée',
    financial: studyState.financial,
    scenarios: studyState.scenarios,
    simulator: studyState.simulator,
    dataQuality: studyState.dataQuality,
    sources: studyState.sources,
    historical: studyState.historical,
    projections: studyState.projections,
    indices: studyState.indices,
    feasibility: studyState.feasibility,
    conclusion: studyState.conclusions.conditional,
  };
}

export const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const money = n => `${new Intl.NumberFormat('fr-FR',{maximumFractionDigits:0}).format(Number(n)||0)} MRU`;
