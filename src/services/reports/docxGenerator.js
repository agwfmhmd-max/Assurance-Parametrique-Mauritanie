import { makeZip } from './zip.js';
import { buildReportData, esc, money } from './reportDataBuilder.js';

const p = (text, style='Normal') => `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr><w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`;
const h = (text, level) => p(text, `Heading${level}`);
const table = rows => `<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single"/><w:left w:val="single"/><w:bottom w:val="single"/><w:right w:val="single"/><w:insideH w:val="single"/><w:insideV w:val="single"/></w:tblBorders></w:tblPr>${rows.map(row=>`<w:tr>${row.map(c=>`<w:tc><w:p><w:r><w:t>${esc(c)}</w:t></w:r></w:p></w:tc>`).join('')}</w:tr>`).join('')}</w:tbl>`;

function documentXml(d) {
  const rows = d.financial.rows || [];
  const scRows = Object.entries(d.scenarios).map(([k,v]) => [k, money(v.net5), `${v.roi.toFixed(1)} %`, money(v.npv), v.irr == null ? 'N/A' : `${v.irr.toFixed(1)} %`]);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
${p(d.institution,'Title')}${p(d.title,'Title')}${p(`Année universitaire : ${d.academicYear}`)}${p(`Version de l’étude : ${d.version}`)}${p(`Date de génération : ${new Date(d.generatedAt).toLocaleString('fr-FR')}`)}${p(`Data Hash : ${d.dataHash}`)}
${h('Remerciements',1)}${p('Cette section peut être personnalisée par l’équipe de projet et son encadrement.')}
${h('Résumé',1)}${p('Ce rapport présente une étude de faisabilité d’un système d’assurance paramétrique contre les risques climatiques en Mauritanie, avec application aux secteurs agricole et de l’élevage. Les résultats sont générés à partir de l’état scientifique courant de la plateforme et doivent être interprétés selon la qualité des données disponibles.')}
${p('Mots-clés : assurance paramétrique ; risques climatiques ; trigger ; exit ; risque de base ; agriculture ; élevage ; réassurance.')}
${h('Abstract',1)}${p('This academic report summarizes the current feasibility model for climate parametric insurance in Mauritania. All quantitative results are linked to the study state and its documented assumptions and data provenance.')}
${h('Introduction générale',1)}${p('L’étude vise à examiner la faisabilité technique, économique, financière, institutionnelle et opérationnelle d’un mécanisme d’assurance paramétrique adapté aux risques climatiques en Mauritanie.')}
${h('Problématique, questions et hypothèses',1)}${p('La problématique porte sur la possibilité de déclencher automatiquement une indemnisation à partir d’un indice climatique observable, tout en maîtrisant le risque de base et les contraintes de données.')}
${h('Chapitre 1 — Cadre théorique',1)}${p('Assurance paramétrique, risques climatiques, trigger, exit, basis risk, NDVI, assurance agricole et pastorale, réassurance.')}
${h('Chapitre 2 — Contexte mauritanien',1)}${p('Le modèle distingue les secteurs agricole et pastoral et n’utilise pas de statistiques non sourcées comme données réelles.')}
${h('Chapitre 3 — Analyse des données climatiques',1)}${p(`Zone active : ${d.zone}. Les observations opérationnelles, réanalyses et projections sont séparées. NDVI et pertes individuelles sont signalés comme indisponibles lorsqu’aucune source n’est enregistrée.`)}
${table([['Type','Statut','Source / dataset'],['Actuel',d.dataQuality.current,'Open-Meteo'],['Historique',d.dataQuality.historical,'ERA5-Land via Open-Meteo'],['Projection',d.dataQuality.projection,'Modèle climatique'],['NDVI',d.dataQuality.ndvi,'Aucune donnée utilisée'],['Pertes réelles',d.dataQuality.losses,'Donnée non disponible']])}
${h('Chapitre 4 — Construction du modèle paramétrique',1)}${p(`Indice / valeur de simulation : ${d.simulator.climateIndex} %. Pondération : précipitations ${d.indices.weights.precip} %, NDVI ${d.indices.weights.ndvi} %, humidité du sol ${d.indices.weights.soilMoisture} %. Les variables indisponibles ne sont pas remplacées par des valeurs fictives.`)}
${h('Chapitre 5 — Modèle actuariel et financier',1)}${table([['Indicateur','Valeur'],['Prime pure',money(d.financial.central.rows[0]?.premiums ? d.simulator?.capital * d.simulator?.probability/100*d.simulator?.severity/100 : 0)],['Prime commerciale',money(d.simulator?.commercialPremium || 0)],['Indemnité simulée',money(d.simulator?.indemnity || 0)],['VAN centrale',money(d.scenarios.central.npv)],['ROI central',`${d.scenarios.central.roi.toFixed(1)} %`],['Seuil de rentabilité',d.scenarios.central.breakEven.viable ? `${d.scenarios.central.breakEven.insuredMin} assurés` : 'Non atteint']])}
${h('Chapitre 6 — Simulations et scénarios',1)}${table([['Scénario','Résultat net cumulé','ROI','VAN','TRI'],...scRows])}
${h('Chapitre 7 — Faisabilité',1)}${table(Object.entries(d.feasibility).map(([k,v])=>[k,String(v)]))}
${h('Chapitre 8 — Limites',1)}${p('Les limites de disponibilité des données sont conservées explicitement. L’absence de données individuelles de pertes ne permet pas d’estimer directement le risque de base par observations de sinistres.')}
${h('Chapitre 9 — Recommandations',1)}${p('Renforcer la collecte historique des sinistres, documenter les sources climatiques, calibrer les pondérations et les paramètres actuariels avec des données locales avant tout usage opérationnel.')}
${h('Conclusion générale',1)}${p(d.conclusion)}
${h('Bibliographie et sources de données',1)}${(d.sources||[]).slice(0,40).map(s=>p(`${s.source} — ${s.dataset||''} — ${s.date} — ${s.sourceUrl||''}`)).join('')}
${h('Annexes',1)}${h('A. Séries historiques',2)}${table([['Année','Température moyenne','Précipitations'],...(d.historical||[]).map(x=>[x.year, x.temperature == null ? 'N/A' : `${x.temperature.toFixed(2)} °C`, `${x.precipitation.toFixed(1)} mm`])])}${h('B. Projections',2)}${table([['Année','Température moyenne','Précipitations'],...(d.projections||[]).map(x=>[x.year, x.temperature == null ? 'N/A' : `${x.temperature.toFixed(2)} °C`, `${x.precipitation.toFixed(1)} mm`])])}
<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
}

export function generateDocx(studyState) {
  const d = buildReportData(studyState);
  const files = [
    { name:'[Content_Types].xml', data:`<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`},
    { name:'_rels/.rels', data:`<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`},
    { name:'word/document.xml', data:documentXml(d) },
    { name:'word/styles.xml', data:`<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style>${[1,2].map(n=>`<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="Heading ${n}"/><w:rPr><w:b/><w:sz w:val="${n===1?28:24}"/></w:rPr></w:style>`).join('')}</w:styles>`},
  ];
  return makeZip(files);
}

export function downloadDocx(studyState) {
  const bytes = generateDocx(studyState); const blob = new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Rapport_APC_${studyState.metadata.version}.docx`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
