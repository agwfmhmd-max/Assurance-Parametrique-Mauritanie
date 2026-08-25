import React, { useMemo } from "react";
import {
  Layers, TrendingUp, ShieldCheck, ClipboardList, ArrowRight,
  Database, Users2, ScrollText, HandCoins,
} from "lucide-react";
import { C, Card, SectionTitle, DataBadge, fmtNumber } from "./shared";
import { DEFAULT_ASSUMPTIONS, projectYears, breakEven, roi, npv } from "../finance/engine";

/* ============================================================
   SYNTHÈSE UNIFIÉE — Executive Summary
   Regroupe, sans inventer aucun chiffre nouveau, la lecture
   transversale des trois piliers de l'étude (technique,
   économique, financier) déjà développés dans les sections
   dédiées, ainsi qu'une feuille de route pour la suite du projet.
   ============================================================ */

const T = {
  fr: {
    eyebrow: "Synthèse exécutive",
    title: "Ce que dit l'étude, en un coup d'œil",
    desc: "Une lecture transversale des dimensions technique, économique et financière du projet, suivie des prochaines étapes recommandées.",
    pillars: [
      {
        icon: Layers, tone: C.blue,
        title: "Faisabilité technique",
        text: "L'architecture indice → seuil → déclenchement → paiement est éprouvée internationalement et transposable au contexte mauritanien, sous réserve de données climatiques et satellitaires documentées et d'une calibration rigoureuse des seuils par zone et par filière.",
      },
      {
        icon: TrendingUp, tone: C.gold,
        title: "Pertinence économique",
        text: "Le marché agricole et pastoral mauritanien reste très largement non couvert par l'assurance classique. L'indemnisation rapide et le faible coût de traitement du modèle paramétrique en font une réponse potentiellement adaptée aux contraintes du secteur rural.",
      },
      {
        icon: ShieldCheck, tone: C.green,
        title: "Viabilité financière",
        text: "Le scénario central du modèle financier interactif reste conditionné aux hypothèses saisies dans l'espace superviseur. Consultez l'étude financière pour la lecture détaillée du ROI, de la VAN, du TRI et du seuil de rentabilité.",
      },
    ],
    statusLabel: "Lecture financière rapide (scénario central)",
    statusNote: "Calculée à partir des hypothèses actuellement enregistrées — aucune valeur n'est inventée.",
    metrics: [
      { key: "roi", label: "ROI cumulé (5 ans)" },
      { key: "npv", label: "VAN (taux courant)" },
      { key: "breakeven", label: "Seuil de rentabilité (assurés)" },
    ],
    conditionsTitle: "Conditions de réussite identifiées",
    conditions: [
      { icon: Database, text: "Qualité et densité des données climatiques et satellitaires" },
      { icon: ScrollText, text: "Cadre réglementaire formalisé pour l'assurance indicielle" },
      { icon: Users2, text: "Éducation financière et assurantielle des bénéficiaires" },
      { icon: HandCoins, text: "Appui institutionnel et subventionnement initial des primes" },
    ],
    nextTitle: "Prochaines étapes recommandées",
    nextDesc: "Enchaînement logique pour faire progresser l'étude vers une phase opérationnelle.",
    nextSteps: [
      { title: "Consolider les données historiques", text: "Collecter et documenter des séries climatiques et de pertes agricoles/pastorales officielles pour remplacer les hypothèses de simulation." },
      { title: "Calibrer les seuils de déclenchement", text: "Ajuster triggers et exits par zone agro-climatique à partir des données consolidées, en minimisant le risque de base." },
      { title: "Valider le modèle financier", text: "Faire réviser les hypothèses de tarification et de réassurance par un actuaire ou un partenaire technique." },
      { title: "Engager les partenaires institutionnels", text: "Initier le dialogue avec les assureurs locaux, les autorités de régulation et les bailleurs potentiels." },
      { title: "Tester un pilote localisé", text: "Déployer le modèle sur une zone restreinte avant tout passage à l'échelle." },
    ],
    cta: "Voir l'étude financière détaillée",
  },
  ar: {
    eyebrow: "خلاصة تنفيذية",
    title: "ما تقوله الدراسة، في لمحة واحدة",
    desc: "قراءة أفقية للأبعاد التقنية والاقتصادية والمالية للمشروع، متبوعة بالخطوات التالية الموصى بها.",
    pillars: [
      {
        icon: Layers, tone: C.blue,
        title: "الجدوى التقنية",
        text: "بنية المؤشر ← العتبة ← التفعيل ← الدفع مُجرَّبة دوليًا وقابلة للتكييف مع السياق الموريتاني، شرط توفر بيانات مناخية وفضائية موثقة ومعايرة دقيقة للعتبات حسب المنطقة والقطاع.",
      },
      {
        icon: TrendingUp, tone: C.gold,
        title: "الملاءمة الاقتصادية",
        text: "لا يزال السوق الزراعي والرعوي الموريتاني إلى حد بعيد غير مشمول بالتأمين التقليدي. التعويض السريع والتكلفة المنخفضة لمعالجة الملفات في النموذج التأشيري يجعلانه استجابة محتملة الملاءمة لقيود القطاع الريفي.",
      },
      {
        icon: ShieldCheck, tone: C.green,
        title: "الاستدامة المالية",
        text: "يبقى السيناريو المركزي للنموذج المالي التفاعلي مرتبطًا بالفرضيات المُدخلة عبر فضاء المشرف. يُرجى مراجعة الدراسة المالية للاطلاع على القراءة التفصيلية لمؤشرات ROI وVAN وTRI وعتبة الربحية.",
      },
    ],
    statusLabel: "قراءة مالية سريعة (السيناريو المركزي)",
    statusNote: "محسوبة انطلاقًا من الفرضيات المسجّلة حاليًا — لا قيمة مختلقة هنا.",
    metrics: [
      { key: "roi", label: "العائد على الاستثمار التراكمي (5 سنوات)" },
      { key: "npv", label: "القيمة الحالية الصافية (بالمعدل الجاري)" },
      { key: "breakeven", label: "عتبة الربحية (عدد المؤمَّن عليهم)" },
    ],
    conditionsTitle: "شروط النجاح المحدَّدة",
    conditions: [
      { icon: Database, text: "جودة وكثافة البيانات المناخية والفضائية" },
      { icon: ScrollText, text: "إطار تنظيمي مُضبوط للتأمين التأشيري" },
      { icon: Users2, text: "محو الأمية المالية والتأمينية لدى المستفيدين" },
      { icon: HandCoins, text: "دعم مؤسسي وتمويل أولي لجزء من الأقساط" },
    ],
    nextTitle: "الخطوات التالية الموصى بها",
    nextDesc: "تسلسل منطقي لدفع الدراسة نحو مرحلة تشغيلية.",
    nextSteps: [
      { title: "توطيد البيانات التاريخية", text: "جمع وتوثيق سلاسل مناخية وخسائر زراعية/رعوية رسمية لتحل محل فرضيات المحاكاة." },
      { title: "معايرة عتبات التفعيل", text: "ضبط عتبات التفعيل والحد الأقصى حسب كل منطقة مناخية-زراعية انطلاقًا من البيانات الموحّدة، مع تقليص خطر الأساس." },
      { title: "التحقق من النموذج المالي", text: "تكليف اكتواري أو شريك تقني بمراجعة فرضيات التسعير وإعادة التأمين." },
      { title: "إشراك الشركاء المؤسسيين", text: "بدء الحوار مع شركات التأمين المحلية والجهات التنظيمية والممولين المحتملين." },
      { title: "تجربة نموذج تجريبي محدود", text: "نشر النموذج في منطقة محدودة قبل أي توسّع." },
    ],
    cta: "عرض الدراسة المالية التفصيلية",
  },
};

export default function ResearchSynthesis({ lang, assumptions, badges }) {
  const t = T[lang] || T.fr;
  const a = { ...DEFAULT_ASSUMPTIONS, ...(assumptions || {}) };
  const rows = useMemo(() => projectYears(a), [a]);
  const be = useMemo(() => breakEven(a), [a]);
  const roiC = useMemo(() => roi(rows, a.initialInvestment), [rows, a]);
  const npvC = useMemo(() => npv(a, rows), [a, rows]);
  const fmt = (v) => fmtNumber(v, lang);
  const na = lang === "ar" ? "غير متاح" : "Non disponible";

  const metricValues = {
    roi: `${roiC.toFixed(1)} %`,
    npv: `${fmt(npvC)} MRU`,
    breakeven: be.viable ? fmt(be.insuredMin) : na,
  };
  const metricTones = {
    roi: roiC >= 0 ? C.green : C.red,
    npv: npvC >= 0 ? C.green : C.red,
    breakeven: be.viable ? C.navy : C.orange,
  };

  return (
    <section id="synthese" className="py-16 md:py-20" style={{ backgroundColor: C.ivory }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <SectionTitle eyebrow={t.eyebrow} title={t.title} desc={t.desc} />
          {badges && <div className="mt-2"><DataBadge type="simulation" labels={badges} /></div>}
        </div>

        {/* Trois piliers */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {t.pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <Card key={i} className="border-t-4" style={{ borderTopColor: p.tone }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${p.tone}18` }}>
                  <Icon size={19} style={{ color: p.tone }} />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ color: C.navy }}>{p.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{p.text}</p>
              </Card>
            );
          })}
        </div>

        {/* Lecture financière rapide */}
        <Card className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <h3 className="text-sm font-bold" style={{ color: C.navy }}>{t.statusLabel}</h3>
            <span className="text-[11px]" style={{ color: C.slateLight }}>{t.statusNote}</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {t.metrics.map((m) => (
              <div key={m.key} className="rounded-xl border p-4" style={{ borderColor: C.border, background: C.white }}>
                <div className="text-xs mb-1.5" style={{ color: C.slate }}>{m.label}</div>
                <div className="font-bold text-xl" style={{ color: metricTones[m.key], fontFamily: "var(--font-display)" }}>{metricValues[m.key]}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Conditions de réussite */}
        <div className="mb-8">
          <h3 className="text-sm font-bold mb-4" style={{ color: C.navy }}>{t.conditionsTitle}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {t.conditions.map((c, i) => {
              const Icon = c.icon;
              return (
                <div key={i} className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: C.border, background: C.white }}>
                  <Icon size={16} className="shrink-0 mt-0.5" style={{ color: C.blue }} />
                  <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{c.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Prochaines étapes recommandées */}
        <Card>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: C.greenSoft }}>
              <ClipboardList size={19} style={{ color: C.green }} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: C.navy }}>{t.nextTitle}</h3>
              <p className="text-xs" style={{ color: C.slateLight }}>{t.nextDesc}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {t.nextSteps.map((s, i) => (
              <div key={i} className="rounded-xl border p-4 flex items-start gap-3" style={{ borderColor: C.border, background: C.ivory }}>
                <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.goldLight }}>
                  {i + 1}
                </span>
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: C.navy }}>{s.title}</div>
                  <p className="text-xs leading-relaxed" style={{ color: C.slate }}>{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <a href="#financier" className="inline-flex items-center gap-1.5 mt-6 text-xs font-bold" style={{ color: C.blue }}>
            {t.cta} <ArrowRight size={14} className={lang === "ar" ? "rotate-180" : ""} />
          </a>
        </Card>
      </div>
    </section>
  );
}
