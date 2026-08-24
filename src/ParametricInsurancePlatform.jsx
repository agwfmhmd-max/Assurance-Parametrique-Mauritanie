import React, { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Globe, Menu, X, Droplets, Wind, Sprout, Beef, Shield,
  Calculator, AlertTriangle, CheckCircle2, ChevronRight,
  ChevronDown, Users, BarChart3, Info, ArrowRight,
  CloudRain, Sun, GraduationCap, Layers, Repeat, Gauge, ExternalLink,
  CloudLightning, Zap, Banknote,
} from "lucide-react";
import {
  C, RISK_COLORS, RISK_LABELS_FR, RISK_LABELS_AR, riskFromIndex, fmtNumber,
  Reveal, Eyebrow, SectionTitle, SimBadge, RiskDot, Card, Tip, ICONS, DataBadge,
} from "./components/shared";
import Logo from "./components/Logo";
import { EXT } from "./i18n/extend";
import { DEFAULT_ASSUMPTIONS } from "./finance/engine";
import { loadAssumptions, saveAssumptions, loadTeam } from "./services/data";
import KpiDashboard from "./components/KpiDashboard";
import ResearchSynthesis from "./components/ResearchSynthesis";
import MarcheSection from "./components/MarcheSection";
import { TechniqueSection, TriggerSimulator } from "./components/TechniqueSection";
import FinanceSection from "./components/FinanceSection";
import { ScenariosSection, SensibiliteSection } from "./components/ScenariosSensibilite";
import { TeamSection, ConclusionSection } from "./components/TeamConclusion";
import AdminPanel from "./components/AdminPanel";

/* ============================================================
   TRANSLATIONS
   ============================================================ */
const T = {
  fr: {
    dir: "ltr",
    nav: { home: "Accueil", etude: "Notre étude", risques: "Risques climatiques", parametrique: "Assurance paramétrique", agricole: "Modèle agricole", elevage: "Modèle élevage", simulateur: "Simulation", resultats: "Résultats", methodologie: "Méthodologie", apropos: "À propos" },
    badgeAcademic: "Projet de fin d'études — ISCAE Mauritanie",
    badgeAcademicShort: "ISCAE · PFE",
    hero: {
      kicker: "Institut Supérieur de Comptabilité et d'Administration des Entreprises — ISCAE",
      title: "Étude de faisabilité de la mise en place d'un système d'assurance paramétrique contre les risques climatiques en Mauritanie",
      subtitle: "Cas des secteurs agricole et de l'élevage",
      desc: "Une approche innovante pour renforcer la résilience financière des secteurs agricole et de l'élevage face aux risques climatiques.",
      cta1: "Explorer l'étude", cta2: "Lancer la simulation",
      flow: ["Mauritanie", "Climat", "Agriculture / Élevage", "Indice paramétrique", "Assurance", "Indemnisation"],
      stats: [
        ["7", "Wilayas analysées"],
        ["2", "Secteurs modélisés"],
        ["5 ans", "Historique climatique"],
        ["0–100", "Indice paramétrique"],
      ],
    },
    simBadge: "SIMULATION ACADÉMIQUE",
    dataSim: "Données simulées à des fins académiques",
    weather: {
      title: "Météo en direct par zone", eyebrow: "Données réelles",
      live: "DONNÉES RÉELLES EN DIRECT", source: "Source : Open-Meteo.com (API météorologique publique)",
      zoneLabel: "Zone", temp: "Température actuelle", humidity: "Humidité relative", wind: "Vent",
      precip7d: "Cumul pluies — 7 derniers jours réels", forecastTitle: "Prévisions à 16 jours", past5Title: "Historique réel — 5 dernières années", future5Title: "Projection climatique — 5 prochaines années", futureNote: "Projection climatique (pas une prévision météorologique). Modèle CMIP6 : EC-Earth3P-HR.", yearly: "Moyenne annuelle", rainYear: "Pluie annuelle", tempYear: "Température moyenne",
      updated: "Mise à jour", refresh: "Actualiser",
      loading: "Connexion aux données météorologiques en direct…",
      error: "L'aperçu intégré de cette plateforme ne peut pas appeler directement une API externe depuis ce navigateur (restriction de sécurité de l'environnement d'aperçu). Sur un déploiement réel (Vercel, Next.js…), ce module affichera les données automatiquement.",
      openLive: "Consulter les données réelles en direct (nouvel onglet)",
      openJson: "Voir le flux JSON brut (Open-Meteo)",
      capital: "Station de référence",
      noRain: "Aucune pluie mesurée sur les 7 derniers jours.",
    },
    etude: {
      title: "Notre étude", eyebrow: "01 · Cadrage académique",
      problTitle: "Problématique",
      problText: "Les aléas climatiques — sécheresse, déficit pluviométrique, dégradation des pâturages — fragilisent chaque année les revenus ruraux, la sécurité alimentaire et la stabilité économique des ménages agricoles et pastoraux en Mauritanie. Les mécanismes assurantiels classiques, fondés sur l'expertise terrain, peinent à répondre à l'ampleur et à la simultanéité de ces chocs.",
      impacts: [
        { icon: "sprout", label: "Agriculture", text: "Baisse des rendements, pertes de récoltes" },
        { icon: "beef", label: "Élevage", text: "Mortalité du cheptel, dégradation des parcours" },
        { icon: "coin", label: "Revenus ruraux", text: "Perte de revenus et endettement des ménages" },
        { icon: "shield", label: "Sécurité alimentaire", text: "Vulnérabilité accrue des populations rurales" },
      ],
      questionTitle: "Question centrale de recherche",
      question: "Dans quelle mesure la mise en place d'un système d'assurance paramétrique peut-elle constituer une solution faisable pour couvrir les risques climatiques affectant les secteurs agricole et de l'élevage en Mauritanie ?",
      objTitle: "Objectifs de l'étude",
      objectives: [
        "Identifier les principaux risques climatiques affectant l'agriculture et l'élevage.",
        "Étudier le fonctionnement de l'assurance paramétrique et ses fondements techniques.",
        "Évaluer la faisabilité de sa mise en place en Mauritanie.",
        "Proposer un modèle adapté au secteur agricole.",
        "Proposer un modèle adapté au secteur de l'élevage.",
        "Évaluer les risques, avantages et limites du modèle proposé.",
        "Simuler le calcul de la prime et de l'indemnisation.",
      ],
    },
    risques: {
      title: "Risques climatiques en Mauritanie", eyebrow: "02 · Tableau de bord",
      intro: "Vue d'ensemble illustrative des principaux aléas climatiques pertinents pour l'agriculture et l'élevage. Les valeurs affichées sont simulées pour la démonstration du modèle.",
      cards: [
        { icon: "drop", title: "Sécheresse", level: "critique", value: "Fréquence élevée" },
        { icon: "cloud", title: "Déficit pluviométrique", level: "severe", value: "Sous la normale saisonnière" },
        { icon: "sun", title: "Fortes températures", level: "vigilance", value: "Pics estivaux marqués" },
        { icon: "wind", title: "Inondations localisées", level: "normal", value: "Épisodes ponctuels" },
        { icon: "layers", title: "Dégradation des pâturages", level: "severe", value: "Pression sur le couvert végétal" },
      ],
      levelsTitle: "Échelle des niveaux de risque",
      levels: [{ n: "Faible", c: "normal" }, { n: "Modéré", c: "vigilance" }, { n: "Élevé", c: "secheresse" }, { n: "Critique", c: "critique" }],
      chartTitle: "Évolution simulée des précipitations (mm) et du NDVI",
    },
    comparaison: {
      title: "Assurance traditionnelle vs paramétrique", eyebrow: "Comparaison",
      head: ["Critère", "Assurance traditionnelle", "Assurance paramétrique"],
      rows: [
        ["Évaluation du sinistre", "Expertise sur le terrain", "Indice climatique prédéfini"],
        ["Délai d'indemnisation", "Plus long", "Rapide"],
        ["Déclenchement", "Perte constatée", "Seuil (trigger) atteint"],
        ["Source des données", "Rapport d'expertise", "Données climatiques / satellitaires"],
        ["Risque de base (basis risk)", "Faible", "Présent"],
        ["Transparence", "Variable", "Élevée"],
        ["Automatisation", "Limitée", "Forte"],
      ],
    },
    parametrique: {
      title: "Comprendre l'assurance paramétrique", eyebrow: "03 · Mécanisme",
      intro: "L'assurance paramétrique indemnise automatiquement l'assuré lorsqu'un indice objectif (pluviométrie, NDVI, température…) franchit un seuil prédéfini — indépendamment de la perte réellement constatée sur le terrain.",
      tabs: ["Comparaison", "Trigger / Exit", "Risque de base", "Indice composite", "Réassurance", "Processus"],
      trigger: {
        title: "Système Trigger / Exit",
        triggerDef: "Trigger : seuil à partir duquel l'indemnisation commence à se déclencher.",
        exitDef: "Exit : seuil correspondant à l'indemnisation maximale (100 %).",
        head: ["Niveau", "Indice climatique", "Indemnisation"],
        rows: [
          ["Normal", "≥ 90 %", "0 %"],
          ["Vigilance", "80 – 89 %", "25 %"],
          ["Sécheresse", "70 – 79 %", "50 %"],
          ["Sévère", "60 – 69 %", "75 %"],
          ["Critique", "< 60 %", "100 %"],
        ],
        note: "Ces valeurs sont des paramètres de simulation académique ; elles devraient être calibrées à partir de séries de données historiques réelles avant tout usage opérationnel.",
      },
      basisRisk: {
        title: "Risque de base — Basis Risk",
        text: "L'événement paramétrique (l'indice) ne correspond pas nécessairement à la perte réelle subie par l'assuré. C'est la principale limite structurelle de l'assurance indicielle.",
        example: "Exemple académique : le modèle climatique indique un déficit pluviométrique insuffisant pour déclencher l'indemnisation, alors que l'agriculteur subit une perte réelle sur sa parcelle.",
        solTitle: "Pistes d'atténuation",
        solutions: [
          "Combiner plusieurs indicateurs (pluviométrie, NDVI, humidité du sol).",
          "Améliorer la résolution géographique des zones assurées.",
          "Croiser NDVI et précipitations pour affiner le signal.",
          "Renforcer la densité et la qualité des stations météorologiques.",
          "Calibrer statistiquement les seuils à partir de données longues.",
        ],
      },
      composite: {
        title: "Modèle d'indice composite",
        text: "Un indice composite combine plusieurs indicateurs climatiques pondérés pour réduire le risque de base. Les pondérations ci-dessous sont des hypothèses de simulation modifiables.",
        agriLabel: "Indice Agricole", agriParts: [["Précipitations", "precip"], ["NDVI", "ndvi"], ["Humidité du sol", "humid"]],
        pastLabel: "Indice Pastoral", pastParts: [["NDVI", "ndvi2"], ["Précipitations", "precip2"], ["Température", "temp2"]],
        hypothesis: "Pondérations hypothétiques — modifiables ci-dessous.",
      },
      reassurance: {
        title: "Réassurance",
        text: "L'assureur cède une partie du risque à un réassureur afin de préserver sa solvabilité face à des chocs climatiques covariants — un même épisode de sécheresse pouvant toucher simultanément un grand nombre d'assurés.",
        reasons: ["Risque de catastrophe climatique", "Concentration géographique des expositions", "Sinistralité simultanée de nombreux assurés", "Préservation de la stabilité financière de l'assureur"],
        chartTitle: "Répartition illustrative du risque",
        legend: ["Conservé par l'assureur", "Cédé au réassureur"],
      },
      timeline: {
        title: "Processus complet, de la souscription au paiement",
        steps: ["Souscription", "Définition de la zone", "Collecte des données", "Calcul de l'indice", "Comparaison au Trigger", "Déclenchement", "Calcul de l'indemnité", "Paiement"],
      },
    },
    agricole: {
      title: "Modèle agricole — APA", eyebrow: "04 · Assurance Paramétrique Agricole",
      risk: "Risque couvert : sécheresse et déficit pluviométrique.",
      indicators: "Indicateurs mobilisés : précipitations, indice de végétation (NDVI), humidité du sol lorsque disponible.",
      indicList: ["Précipitations cumulées", "NDVI (indice de végétation)", "Humidité du sol (si disponible)"],
      cta: "Simuler un contrat agricole",
    },
    elevage: {
      title: "Modèle pastoral — APP", eyebrow: "05 · Assurance Paramétrique Pastorale",
      risk: "Risque couvert : sécheresse pastorale.",
      indicators: "Indicateurs mobilisés : NDVI, précipitations, température, état des pâturages.",
      ispTitle: "Indice de Sécheresse Pastorale (ISP)",
      ispScale: ["Normal", "Vigilance", "Sécheresse", "Sécheresse sévère", "Situation critique"],
      cta: "Simuler un contrat pastoral",
    },
    simulateur: {
      title: "Simulateur d'assurance paramétrique", eyebrow: "06 · Cœur de la démonstration",
      intro: "Ajustez les paramètres pour observer, en temps réel, le déclenchement et le calcul de l'indemnisation ainsi que la prime indicative correspondante.",
      sector: "Secteur", sectorAgri: "Agriculture", sectorElevage: "Élevage",
      zone: "Zone d'étude", capital: "Capital assuré (MRU)", index: "Indice climatique observé (%)",
      coverage: "Niveau de couverture souhaité (%)",
      resultTitle: "Résultat de la simulation",
      riskLevel: "Niveau de risque", triggered: "Déclenchement", triggeredYes: "Oui — seuil atteint", triggeredNo: "Non — sous le seuil",
      indemnPct: "Taux d'indemnisation", indemnAmount: "Montant de l'indemnité",
      premium: "Prime indicative", loss: "Perte potentielle estimée", ratio: "Ratio indemnité / prime",
      detailBtn: "Voir le détail du calcul", detailBtnClose: "Masquer le détail du calcul",
      premiumParamsTitle: "Paramètres de calcul de la prime",
      probability: "Probabilité de sinistre (%)", severity: "Sévérité moyenne attendue (%)",
      feeRate: "Frais de gestion (%)", reinsRate: "Coût de réassurance (%)", margin: "Marge (%)",
      example: "Exemple académique",
    },
    calc: {
      title: "Détail du calcul",
      step1: "1. Niveau de risque à partir de l'indice climatique",
      step2: "2. Taux et montant de l'indemnité",
      step3: "3. Prime pure",
      step4: "4. Prime commerciale",
      purePremiumFormula: "Prime pure = Probabilité × Capital assuré × Sévérité moyenne attendue",
      commercialFormula: "Prime commerciale = Prime pure + Frais de gestion + Coût de réassurance + Marge",
      indemniteFormula: "Indemnité = Capital assuré × Taux d'indemnisation",
      simNote: "Simulation académique — ces montants n'ont pas de valeur tarifaire réelle.",
    },
    faisabilite: {
      title: "Étude de faisabilité", eyebrow: "Synthèse",
      cats: [
        { t: "Faisabilité technique", icon: "gauge", items: ["Disponibilité des données climatiques", "Infrastructure numérique et connectivité", "Capacité de calcul des indices", "Niveau d'automatisation possible"] },
        { t: "Faisabilité économique", icon: "coin", items: ["Coût du produit d'assurance", "Capacité de paiement des ménages ruraux", "Coût attendu des sinistres", "Potentiel du marché mauritanien"] },
        { t: "Faisabilité financière", icon: "chart", items: ["Structure des primes", "Volume attendu des indemnités", "Ratio sinistres / primes", "Rôle de la réassurance", "Rentabilité du produit"] },
        { t: "Faisabilité institutionnelle et réglementaire", icon: "building", items: ["Cadre réglementaire de l'assurance en Mauritanie à vérifier", "Rôle des autorités de supervision", "Partenariats institutionnels envisageables", "Protection des assurés"] },
      ],
      note: "Les éléments réglementaires doivent être vérifiés auprès des textes officiels en vigueur ; aucune disposition juridique n'est inventée dans cette plateforme.",
    },
    methodologie: {
      title: "Méthodologie", eyebrow: "07 · Démarche de recherche",
      quantTitle: "Approche quantitative",
      quant: ["Données climatiques (précipitations, température)", "Données agricoles", "Données pastorales", "Analyse statistique des séries"],
      qualTitle: "Approche qualitative",
      qual: ["Questionnaires auprès des ménages ruraux", "Entretiens semi-directifs", "Perception des agriculteurs", "Perception des éleveurs", "Perception des acteurs de l'assurance"],
    },
    sondage: {
      title: "Sondage interactif", eyebrow: "Enquête de terrain — en direct",
      intro: "Ce sondage est réellement fonctionnel : les réponses sont enregistrées et les résultats affichés se calculent à partir des réponses effectivement soumises depuis cette plateforme (utile pour la collecte pendant votre enquête ou une démonstration devant le jury).",
      shareNote: "Les réponses envoyées sont enregistrées de façon anonyme pour alimenter les résultats agrégés (usage académique, aucune donnée personnelle identifiante n'est demandée). Les résultats agrégés sont publiés sur cette plateforme à des fins académiques ; aucune donnée personnelle n'est affichée.",
      formTab: "Répondre au sondage", resultsTab: "Résultats en direct",
      submit: "Envoyer mes réponses", submitting: "Envoi en cours…",
      thanksTitle: "Merci pour votre réponse !", thanksText: "Votre réponse a été enregistrée et intégrée aux résultats en direct.",
      newResponse: "Répondre à nouveau",
      totalResponses: "Réponses collectées", noResponses: "Aucune réponse collectée pour le moment. Soyez le premier à répondre à ce sondage.",
      loading: "Chargement des résultats…", errorSubmit: "Une erreur est survenue lors de l'envoi. Veuillez réessayer.", errorLoad: "Une erreur est survenue lors du chargement des résultats.",
      refresh: "Actualiser les résultats", required: "Merci de répondre à toutes les questions avant d'envoyer.",
      adminLink: "Accès résultats (équipe du projet)", adminTitle: "Espace réservé à l'équipe du projet",
      adminDesc: "Les résultats détaillés sont réservés à l'équipe du projet et sont gérés depuis la plateforme du sondage.",
      adminCodeLabel: "Code d'accès", adminSubmit: "Accéder aux résultats", adminWrong: "Code incorrect. Veuillez réessayer.",
      adminBack: "Retour au sondage",
      questions: [
        { q: "Êtes-vous agriculteur ou éleveur ?", options: ["Agriculteur", "Éleveur", "Les deux"] },
        { q: "Avez-vous déjà subi une perte liée au climat ?", options: ["Oui", "Non"] },
        { q: "Avez-vous déjà utilisé une assurance ?", options: ["Oui", "Non"] },
        { q: "Seriez-vous intéressé par une assurance contre la sécheresse ?", options: ["Oui", "Non", "Indécis"] },
        { q: "Préférez-vous une indemnisation rapide basée sur un indice climatique ?", options: ["Oui", "Non"] },
        { q: "Faites-vous confiance aux données météorologiques ?", options: ["Oui", "Partiellement", "Non"] },
        { q: "Accepteriez-vous une assurance paramétrique ?", options: ["Oui", "Non"] },
        { q: "Quel montant seriez-vous prêt à payer annuellement pour cette assurance ?", options: ["Moins de 2 000 MRU", "2 000 – 5 000 MRU", "5 000 – 10 000 MRU", "Plus de 10 000 MRU"] },
      ],
    },
    resultats: {
      title: "Tableau de bord des résultats", eyebrow: "08 · Visualisation",
      charts: ["Précipitations — moyennes mensuelles indicatives", "NDVI — dynamique saisonnière indicative", "Exposition relative à la sécheresse par zone", "Prime vs indemnité par scénario"],
    },
    carte: {
      title: "Zones d'étude en Mauritanie", eyebrow: "Carte & profils climatiques",
      note: "Représentation schématique et illustrative — aucune coordonnée géographique officielle n'est utilisée pour le positionnement sur le schéma.",
      climateNote: "Les plages de pluviométrie indiquées reflètent le gradient climatique sahélien connu de la Mauritanie (aridité croissante du sud vers le nord, cf. Ministère de l'Environnement et du Développement Durable — climat de la Mauritanie). Ce sont des ordres de grandeur académiques, pas des relevés officiels : à remplacer par les données de l'Office National de la Météorologie (ONM) pour un usage opérationnel.",
      tableHead: ["Zone (Wilaya)", "Secteur dominant", "Pluviométrie indicative", "Exposition au risque"],
    },
    apropos: {
      title: "À propos du projet", eyebrow: "Fiche projet",
      project: "Projet de fin d'études", specialty: "Spécialité : Banque et Assurance", level: "Niveau : Licence 3",
      school: "Institut Supérieur de Comptabilité et d'Administration des Entreprises (ISCAE) — Mauritanie",
    },
    footer: {
      line1: "Étude de faisabilité de l'assurance paramétrique climatique en Mauritanie",
      line2: "Projet académique — Banque et Assurance — ISCAE",
      rights: "© 2026 — Projet de fin d'études",
      dev: "Développé par MDA",
    },
    tooltips: {
      trigger: "Trigger : seuil d'indice à partir duquel l'indemnisation se déclenche.",
      exit: "Exit : seuil d'indice correspondant à l'indemnisation maximale (100 %).",
      basisRisk: "Basis risk : écart possible entre l'indice mesuré et la perte réelle de l'assuré.",
      ndvi: "NDVI : indice de végétation par différence normalisée, mesuré par satellite.",
      purePremium: "Prime pure : coût actuariel théorique du risque, hors frais et marge.",
      reassurance: "Réassurance : transfert d'une partie du risque de l'assureur vers un réassureur.",
    },
    glossaryTitle: "Glossaire express",
  },

  ar: {
    dir: "rtl",
    nav: { home: "الرئيسية", etude: "دراستنا", risques: "المخاطر المناخية", parametrique: "التأمين التأشيري", agricole: "النموذج الزراعي", elevage: "نموذج الثروة الحيوانية", simulateur: "المحاكاة", resultats: "النتائج", methodologie: "المنهجية", apropos: "حول المشروع" },
    badgeAcademic: "مشروع تخرج — إسكاي موريتانيا",
    badgeAcademicShort: "ISCAE · مشروع تخرج",
    hero: {
      kicker: "المعهد العالي للمحاسبة وإدارة المؤسسات — ISCAE",
      title: "دراسة جدوى إنشاء نظام تأمين تأشيري ضد المخاطر المناخية في موريتانيا",
      subtitle: "حالة قطاعي الزراعة وتربية الماشية",
      desc: "مقاربة مبتكرة لتعزيز الصمود المالي لقطاعي الزراعة وتربية الماشية أمام المخاطر المناخية.",
      cta1: "استكشاف الدراسة", cta2: "بدء المحاكاة",
      flow: ["موريتانيا", "المناخ", "الزراعة / تربية الماشية", "المؤشر التأشيري", "التأمين", "التعويض"],
      stats: [
        ["7", "ولايات مدروسة"],
        ["2", "قطاعات نموذجية"],
        ["5 سنوات", "سجل مناخي"],
        ["0–100", "مؤشر تأشيري"],
      ],
    },
    simBadge: "محاكاة أكاديمية",
    dataSim: "بيانات محاكاة لأغراض أكاديمية",
    weather: {
      title: "الطقس المباشر حسب المنطقة", eyebrow: "بيانات حقيقية",
      live: "بيانات حقيقية مباشرة", source: "المصدر: Open-Meteo.com (واجهة برمجية جوية عمومية)",
      zoneLabel: "المنطقة", temp: "درجة الحرارة الحالية", humidity: "الرطوبة النسبية", wind: "الرياح",
      precip7d: "تراكم الأمطار — آخر 7 أيام فعلية", forecastTitle: "توقعات 16 يومًا", past5Title: "السجل الفعلي — آخر 5 سنوات", future5Title: "الإسقاط المناخي — السنوات الخمس القادمة", futureNote: "هذا إسقاط مناخي وليس توقعًا للطقس. نموذج CMIP6: EC-Earth3P-HR.", yearly: "المتوسط السنوي", rainYear: "الأمطار السنوية", tempYear: "متوسط الحرارة",
      updated: "آخر تحديث", refresh: "تحديث",
      loading: "جارٍ الاتصال بالبيانات الجوية المباشرة…",
      error: "لا يمكن لمعاينة هذه المنصة استدعاء واجهة برمجية خارجية مباشرة من هذا المتصفح (قيد أمني خاص ببيئة المعاينة). عند النشر الفعلي (Vercel، Next.js...) ستعرض هذه الوحدة البيانات تلقائيًا.",
      openLive: "الاطلاع على البيانات الحقيقية المباشرة (نافذة جديدة)",
      openJson: "عرض تدفق JSON الخام (Open-Meteo)",
      capital: "محطة مرجعية",
      noRain: "لم تُسجَّل أي أمطار خلال آخر 7 أيام.",
    },
    etude: {
      title: "دراستنا", eyebrow: "01 · الإطار الأكاديمي",
      problTitle: "الإشكالية",
      problText: "تُضعف المخاطر المناخية — الجفاف، نقص التساقطات، تدهور المراعي — سنويًا دخل الأسر الريفية والأمن الغذائي والاستقرار الاقتصادي للقطاعين الزراعي والرعوي في موريتانيا. وتجد آليات التأمين التقليدية، القائمة على الخبرة الميدانية، صعوبة في مواكبة حجم هذه الصدمات وتزامنها.",
      impacts: [
        { icon: "sprout", label: "الزراعة", text: "تراجع المحاصيل وخسائر الإنتاج" },
        { icon: "beef", label: "تربية الماشية", text: "نفوق القطيع وتدهور المراعي" },
        { icon: "coin", label: "الدخل الريفي", text: "فقدان الدخل وتفاقم مديونية الأسر" },
        { icon: "shield", label: "الأمن الغذائي", text: "زيادة هشاشة السكان الريفيين" },
      ],
      questionTitle: "سؤال البحث المركزي",
      question: "إلى أي مدى يمكن أن يشكّل إنشاء نظام تأمين تأشيري حلاً قابلاً للتطبيق لتغطية المخاطر المناخية التي تمس قطاعي الزراعة وتربية الماشية في موريتانيا؟",
      objTitle: "أهداف الدراسة",
      objectives: [
        "تحديد أبرز المخاطر المناخية التي تمس الزراعة وتربية الماشية.",
        "دراسة آلية عمل التأمين التأشيري وأسسه التقنية.",
        "تقييم جدوى إنشائه في موريتانيا.",
        "اقتراح نموذج ملائم للقطاع الزراعي.",
        "اقتراح نموذج ملائم لقطاع تربية الماشية.",
        "تقييم مخاطر النموذج المقترح ومزاياه وحدوده.",
        "محاكاة احتساب القسط والتعويض.",
      ],
    },
    risques: {
      title: "المخاطر المناخية في موريتانيا", eyebrow: "02 · لوحة القيادة",
      intro: "نظرة عامة توضيحية على أبرز المخاطر المناخية ذات الصلة بالزراعة وتربية الماشية. القيم المعروضة محاكاة لغرض توضيح النموذج.",
      cards: [
        { icon: "drop", title: "الجفاف", level: "critique", value: "تواتر مرتفع" },
        { icon: "cloud", title: "نقص التساقطات", level: "severe", value: "دون المعدل الموسمي" },
        { icon: "sun", title: "ارتفاع درجات الحرارة", level: "vigilance", value: "ذروات صيفية ملحوظة" },
        { icon: "wind", title: "فيضانات محلية", level: "normal", value: "حالات متفرقة" },
        { icon: "layers", title: "تدهور المراعي", level: "severe", value: "ضغط على الغطاء النباتي" },
      ],
      levelsTitle: "سلم مستويات الخطر",
      levels: [{ n: "منخفض", c: "normal" }, { n: "معتدل", c: "vigilance" }, { n: "مرتفع", c: "secheresse" }, { n: "حرج", c: "critique" }],
      chartTitle: "تطور محاكى للتساقطات (ملم) ومؤشر NDVI",
    },
    comparaison: {
      title: "التأمين التقليدي مقابل التأشيري", eyebrow: "مقارنة",
      head: ["المعيار", "التأمين التقليدي", "التأمين التأشيري"],
      rows: [
        ["تقييم الضرر", "خبرة ميدانية", "مؤشر محدد مسبقًا"],
        ["مدة التعويض", "أطول", "سريعة"],
        ["التفعيل", "معاينة الخسارة", "بلوغ العتبة (Trigger)"],
        ["مصدر البيانات", "تقرير الخبرة", "بيانات مناخية / فضائية"],
        ["خطر الأساس (Basis Risk)", "ضعيف", "قائم"],
        ["الشفافية", "متفاوتة", "مرتفعة"],
        ["الأتمتة", "محدودة", "قوية"],
      ],
    },
    parametrique: {
      title: "فهم التأمين التأشيري", eyebrow: "03 · الآلية",
      intro: "يعوّض التأمين التأشيري المؤمَّن له تلقائيًا عند تجاوز مؤشر موضوعي (التساقطات، NDVI، الحرارة...) عتبة محددة مسبقًا — بمعزل عن الخسارة الفعلية المعاينة ميدانيًا.",
      tabs: ["مقارنة", "Trigger / Exit", "خطر الأساس", "المؤشر المركب", "إعادة التأمين", "المسار"],
      trigger: {
        title: "نظام Trigger / Exit",
        triggerDef: "Trigger: العتبة التي يبدأ عندها التعويض بالتفعيل.",
        exitDef: "Exit: العتبة المطابقة للتعويض الأقصى (100%).",
        head: ["المستوى", "المؤشر المناخي", "نسبة التعويض"],
        rows: [
          ["عادي", "≥ 90%", "0%"],
          ["يقظة", "80 – 89%", "25%"],
          ["جفاف", "70 – 79%", "50%"],
          ["حاد", "60 – 69%", "75%"],
          ["حرج", "< 60%", "100%"],
        ],
        note: "هذه القيم بارامترات محاكاة أكاديمية؛ ويجب معايرتها انطلاقًا من سلاسل بيانات تاريخية حقيقية قبل أي استخدام تشغيلي.",
      },
      basisRisk: {
        title: "خطر الأساس — Basis Risk",
        text: "لا يطابق الحدث التأشيري (المؤشر) بالضرورة الخسارة الفعلية التي يتكبدها المؤمَّن له. وهو الحد البنيوي الرئيسي للتأمين المؤشري.",
        example: "مثال أكاديمي: يشير النموذج المناخي إلى عجز مطري غير كافٍ لتفعيل التعويض، بينما يتكبد الفلاح خسارة فعلية في قطعته.",
        solTitle: "سبل التخفيف",
        solutions: [
          "الجمع بين عدة مؤشرات (التساقطات، NDVI، رطوبة التربة).",
          "تحسين الدقة الجغرافية للمناطق المؤمَّنة.",
          "الربط بين NDVI والتساقطات لتدقيق الإشارة.",
          "تعزيز كثافة وجودة المحطات الأرصادية.",
          "معايرة العتبات إحصائيًا انطلاقًا من بيانات طويلة المدى.",
        ],
      },
      composite: {
        title: "نموذج المؤشر المركب",
        text: "يجمع المؤشر المركب عدة مؤشرات مناخية مرجّحة للحد من خطر الأساس. الأوزان أدناه فرضيات محاكاة قابلة للتعديل.",
        agriLabel: "المؤشر الزراعي", agriParts: [["التساقطات", "precip"], ["NDVI", "ndvi"], ["رطوبة التربة", "humid"]],
        pastLabel: "المؤشر الرعوي", pastParts: [["NDVI", "ndvi2"], ["التساقطات", "precip2"], ["الحرارة", "temp2"]],
        hypothesis: "أوزان افتراضية — قابلة للتعديل أدناه.",
      },
      reassurance: {
        title: "إعادة التأمين",
        text: "تحيل شركة التأمين جزءًا من الخطر إلى معيد التأمين للحفاظ على ملاءتها المالية أمام الصدمات المناخية المتزامنة — إذ يمكن لموجة جفاف واحدة أن تمس عددًا كبيرًا من المؤمَّن لهم في آن واحد.",
        reasons: ["خطر الكارثة المناخية", "التركّز الجغرافي للتعرّضات", "تزامن المطالبات لدى عدد كبير من المؤمَّن لهم", "الحفاظ على الاستقرار المالي لشركة التأمين"],
        chartTitle: "توزيع توضيحي للخطر",
        legend: ["محتفظ به لدى المؤمِّن", "محال إلى معيد التأمين"],
      },
      timeline: {
        title: "المسار الكامل من الاكتتاب إلى الدفع",
        steps: ["الاكتتاب", "تحديد المنطقة", "جمع البيانات", "احتساب المؤشر", "المقارنة بعتبة Trigger", "التفعيل", "احتساب التعويض", "الدفع"],
      },
    },
    agricole: {
      title: "النموذج الزراعي — APA", eyebrow: "04 · التأمين التأشيري الزراعي",
      risk: "الخطر المغطى: الجفاف ونقص التساقطات.",
      indicators: "المؤشرات المعتمدة: التساقطات، مؤشر الغطاء النباتي (NDVI)، رطوبة التربة عند توفرها.",
      indicList: ["التساقطات التراكمية", "NDVI (مؤشر الغطاء النباتي)", "رطوبة التربة (إن توفرت)"],
      cta: "محاكاة عقد زراعي",
    },
    elevage: {
      title: "النموذج الرعوي — APP", eyebrow: "05 · التأمين التأشيري الرعوي",
      risk: "الخطر المغطى: الجفاف الرعوي.",
      indicators: "المؤشرات المعتمدة: NDVI، التساقطات، الحرارة، حالة المراعي.",
      ispTitle: "مؤشر الجفاف الرعوي (ISP)",
      ispScale: ["عادي", "يقظة", "جفاف", "جفاف حاد", "وضع حرج"],
      cta: "محاكاة عقد رعوي",
    },
    simulateur: {
      title: "محاكي التأمين التأشيري", eyebrow: "06 · جوهر العرض التوضيحي",
      intro: "اضبط المعطيات لمشاهدة التفعيل واحتساب التعويض والقسط الاسترشادي المقابل مباشرة.",
      sector: "القطاع", sectorAgri: "الزراعة", sectorElevage: "تربية الماشية",
      zone: "منطقة الدراسة", capital: "رأس المال المؤمَّن (أوقية)", index: "المؤشر المناخي المرصود (%)",
      coverage: "مستوى التغطية المرغوب (%)",
      resultTitle: "نتيجة المحاكاة",
      riskLevel: "مستوى الخطر", triggered: "التفعيل", triggeredYes: "نعم — تم بلوغ العتبة", triggeredNo: "لا — دون العتبة",
      indemnPct: "نسبة التعويض", indemnAmount: "مبلغ التعويض",
      premium: "القسط الاسترشادي", loss: "الخسارة المحتملة المقدَّرة", ratio: "نسبة التعويض إلى القسط",
      detailBtn: "عرض تفاصيل الاحتساب", detailBtnClose: "إخفاء تفاصيل الاحتساب",
      premiumParamsTitle: "معطيات احتساب القسط",
      probability: "احتمال وقوع الضرر (%)", severity: "الشدة المتوسطة المتوقعة (%)",
      feeRate: "مصاريف التسيير (%)", reinsRate: "تكلفة إعادة التأمين (%)", margin: "الهامش (%)",
      example: "مثال أكاديمي",
    },
    calc: {
      title: "تفاصيل الاحتساب",
      step1: "1. مستوى الخطر انطلاقًا من المؤشر المناخي",
      step2: "2. نسبة التعويض ومبلغه",
      step3: "3. القسط الصافي",
      step4: "4. القسط التجاري",
      purePremiumFormula: "القسط الصافي = الاحتمال × رأس المال المؤمَّن × الشدة المتوسطة المتوقعة",
      commercialFormula: "القسط التجاري = القسط الصافي + مصاريف التسيير + تكلفة إعادة التأمين + الهامش",
      indemniteFormula: "التعويض = رأس المال المؤمَّن × نسبة التعويض",
      simNote: "محاكاة أكاديمية — لا تعكس هذه المبالغ تسعيرة حقيقية.",
    },
    faisabilite: {
      title: "دراسة الجدوى", eyebrow: "خلاصة",
      cats: [
        { t: "الجدوى التقنية", icon: "gauge", items: ["توفر البيانات المناخية", "البنية التحتية الرقمية والاتصال", "القدرة على احتساب المؤشرات", "درجة الأتمتة الممكنة"] },
        { t: "الجدوى الاقتصادية", icon: "coin", items: ["تكلفة منتج التأمين", "القدرة الشرائية للأسر الريفية", "التكلفة المتوقعة للمطالبات", "إمكانات السوق الموريتاني"] },
        { t: "الجدوى المالية", icon: "chart", items: ["بنية الأقساط", "الحجم المتوقع للتعويضات", "نسبة المطالبات إلى الأقساط", "دور إعادة التأمين", "ربحية المنتج"] },
        { t: "الجدوى المؤسسية والتنظيمية", icon: "building", items: ["الإطار التنظيمي للتأمين في موريتانيا (يجب التحقق منه)", "دور سلطات الإشراف", "الشراكات المؤسسية الممكنة", "حماية المؤمَّن لهم"] },
      ],
      note: "يجب التحقق من العناصر التنظيمية لدى النصوص الرسمية السارية؛ لا يتم اختلاق أي حكم قانوني في هذه المنصة.",
    },
    methodologie: {
      title: "المنهجية", eyebrow: "07 · مقاربة البحث",
      quantTitle: "المقاربة الكمية",
      quant: ["بيانات مناخية (تساقطات، حرارة)", "بيانات زراعية", "بيانات رعوية", "تحليل إحصائي للسلاسل"],
      qualTitle: "المقاربة الكيفية",
      qual: ["استبيانات لدى الأسر الريفية", "مقابلات شبه موجهة", "تصورات الفلاحين", "تصورات مربي الماشية", "تصورات الفاعلين في التأمين"],
    },
    sondage: {
      title: "الاستبيان التفاعلي", eyebrow: "استقصاء ميداني — مباشر",
      intro: "هذا الاستبيان فعّال بالكامل: تُسجَّل الإجابات وتُحتسب النتائج المعروضة انطلاقًا من الردود المُرسَلة فعليًا عبر هذه المنصة (مفيد لجمع البيانات أثناء استقصائكم أو للعرض أمام لجنة المناقشة).",
      shareNote: "تُسجَّل الإجابات المُرسَلة بشكل مجهول لتغذية النتائج الإجمالية (استخدام أكاديمي، لا تُطلب أي بيانات شخصية مُعرِّفة). النتائج الإجمالية تُعرض على هذه المنصة لأغراض أكاديمية، دون أي بيانات شخصية.",
      formTab: "الإجابة على الاستبيان", resultsTab: "النتائج المباشرة",
      submit: "إرسال إجاباتي", submitting: "جارٍ الإرسال…",
      thanksTitle: "شكرًا على إجابتك!", thanksText: "تم تسجيل إجابتك وإدراجها ضمن النتائج المباشرة.",
      newResponse: "الإجابة مجددًا",
      totalResponses: "عدد الردود المجمَّعة", noResponses: "لم يتم جمع أي رد حتى الآن. كن أول من يجيب على هذا الاستبيان.",
      loading: "جارٍ تحميل النتائج…", errorSubmit: "حدث خطأ أثناء الإرسال. يرجى المحاولة مجددًا.", errorLoad: "حدث خطأ أثناء تحميل النتائج.",
      refresh: "تحديث النتائج", required: "يرجى الإجابة على جميع الأسئلة قبل الإرسال.",
      adminLink: "الوصول إلى النتائج (فريق المشروع)", adminTitle: "مساحة مخصّصة لفريق المشروع",
      adminDesc: "النتائج التفصيلية مخصصة لفريق المشروع وتُدار من منصة الاستبيان.",
      adminCodeLabel: "رمز الوصول", adminSubmit: "الدخول إلى النتائج", adminWrong: "رمز غير صحيح. يرجى المحاولة مجددًا.",
      adminBack: "العودة إلى الاستبيان",
      questions: [
        { q: "هل أنت فلاح أم مربي ماشية؟", options: ["فلاح", "مربي ماشية", "كلاهما"] },
        { q: "هل سبق أن تكبدت خسارة مرتبطة بالمناخ؟", options: ["نعم", "لا"] },
        { q: "هل سبق أن استخدمت تأمينًا؟", options: ["نعم", "لا"] },
        { q: "هل أنت مهتم بتأمين ضد الجفاف؟", options: ["نعم", "لا", "غير محدد"] },
        { q: "هل تفضل تعويضًا سريعًا يعتمد على مؤشر مناخي؟", options: ["نعم", "لا"] },
        { q: "هل تثق في البيانات الأرصادية؟", options: ["نعم", "جزئيًا", "لا"] },
        { q: "هل تقبل بتأمين تأشيري؟", options: ["نعم", "لا"] },
        { q: "ما المبلغ الذي تكون مستعدًا لدفعه سنويًا مقابل هذا التأمين؟", options: ["أقل من 2000 أوقية", "2000 – 5000 أوقية", "5000 – 10000 أوقية", "أكثر من 10000 أوقية"] },
      ],
    },
    resultats: {
      title: "لوحة قيادة النتائج", eyebrow: "08 · التصور البياني",
      charts: ["التساقطات — معدلات شهرية إرشادية", "NDVI — الدينامية الموسمية الإرشادية", "التعرض النسبي للجفاف حسب المنطقة", "القسط مقابل التعويض حسب السيناريو"],
    },
    carte: {
      title: "مناطق الدراسة في موريتانيا", eyebrow: "خريطة وملامح مناخية",
      note: "تمثيل تخطيطي وتوضيحي — لا تُستخدم أي إحداثيات جغرافية رسمية في وضع النقاط على المخطط.",
      climateNote: "تعكس نطاقات التساقطات المذكورة التدرج المناخي الساحلي المعروف لموريتانيا (جفاف متزايد من الجنوب نحو الشمال، وفق وزارة البيئة والتنمية المستدامة — مناخ موريتانيا). وهي قيم إرشادية أكاديمية وليست معطيات رسمية مرصودة: يجب استبدالها ببيانات المكتب الوطني للأرصاد الجوية (ONM) للاستخدام التشغيلي.",
      tableHead: ["المنطقة (الولاية)", "القطاع الغالب", "التساقطات الإرشادية", "درجة التعرض للخطر"],
    },
    apropos: {
      title: "حول المشروع", eyebrow: "بطاقة المشروع",
      project: "مشروع تخرج", specialty: "التخصص: بنوك وتأمين", level: "المستوى: الإجازة 3",
      school: "المعهد العالي للمحاسبة وإدارة المؤسسات (ISCAE) — موريتانيا",
    },
    footer: {
      line1: "دراسة جدوى التأمين التأشيري المناخي في موريتانيا",
      line2: "مشروع أكاديمي — بنوك وتأمين — إسكاي",
      rights: "© 2026 — مشروع تخرج",
      dev: "تطوير: MDA",
    },
    tooltips: {
      trigger: "Trigger: عتبة المؤشر التي يبدأ عندها التعويض.",
      exit: "Exit: عتبة المؤشر المطابقة للتعويض الأقصى (100%).",
      basisRisk: "خطر الأساس: فارق محتمل بين المؤشر المرصود والخسارة الفعلية للمؤمَّن له.",
      ndvi: "NDVI: مؤشر الغطاء النباتي بالفارق المعياري، يُقاس عبر الأقمار الصناعية.",
      purePremium: "القسط الصافي: التكلفة الاكتوارية النظرية للخطر، دون مصاريف أو هامش.",
      reassurance: "إعادة التأمين: تحويل جزء من الخطر من المؤمِّن إلى معيد التأمين.",
    },
    glossaryTitle: "معجم مختصر",
  },
};

/* ============================================================
   SIMULATED DATA (clearly labeled academic simulation)
   ============================================================ */
const RAINFALL_DATA = [
  { m: "Jan", precip: 5, ndvi: 22 }, { m: "Fév", precip: 3, ndvi: 20 }, { m: "Mar", precip: 2, ndvi: 18 },
  { m: "Avr", precip: 4, ndvi: 21 }, { m: "Mai", precip: 12, ndvi: 28 }, { m: "Juin", precip: 28, ndvi: 40 },
  { m: "Juil", precip: 61, ndvi: 58 }, { m: "Août", precip: 74, ndvi: 66 }, { m: "Sep", precip: 45, ndvi: 55 },
  { m: "Oct", precip: 14, ndvi: 38 }, { m: "Nov", precip: 6, ndvi: 27 }, { m: "Déc", precip: 4, ndvi: 23 },
];

const ZONES = ["Trarza", "Brakna", "Gorgol", "Assaba", "Hodh El Gharbi", "Hodh Ech Chargui", "Guidimakha"];

const ZONE_AR = {
  "Trarza": "الترارزة", "Brakna": "البراكنة", "Gorgol": "كوركل", "Assaba": "العصابة",
  "Hodh El Gharbi": "الحوض الغربي", "Hodh Ech Chargui": "الحوض الشرقي", "Guidimakha": "كيدي ماغا",
};

// Coordonnées réelles des chefs-lieux de wilaya, utilisées pour interroger l'API météo publique
// Open-Meteo (données réelles en direct, gratuite, sans clé API).
const ZONE_COORDS = {
  "Trarza": { lat: 16.5145, lon: -15.8050, capital: "Rosso" },
  "Brakna": { lat: 17.0501, lon: -13.9134, capital: "Aleg" },
  "Gorgol": { lat: 16.1500, lon: -13.5000, capital: "Kaédi" },
  "Assaba": { lat: 16.6167, lon: -11.4000, capital: "Kiffa" },
  "Hodh El Gharbi": { lat: 16.6614, lon: -9.6014, capital: "Ayoun El Atrous" },
  "Hodh Ech Chargui": { lat: 16.6167, lon: -7.2500, capital: "Néma" },
  "Guidimakha": { lat: 15.1594, lon: -12.1844, capital: "Sélibaby" },
};

// Profils indicatifs par zone — ordres de grandeur académiques basés sur le gradient climatique
// sahélien connu de la Mauritanie (aridité croissante du nord vers le sud), sourcés qualitativement
// du Ministère de l'Environnement et du Développement Durable et de classifications climatiques
// publiques (Köppen). Non officiels — à recalibrer avec les données de l'ONM.
const ZONE_DETAILS = [
  { zone: "Trarza", dominant: "agri", rainfall: "≈ 100 – 250 mm/an", risk: "severe" },
  { zone: "Brakna", dominant: "mixte", rainfall: "≈ 150 – 300 mm/an", risk: "severe" },
  { zone: "Gorgol", dominant: "agri", rainfall: "≈ 300 – 450 mm/an", risk: "vigilance" },
  { zone: "Assaba", dominant: "elevage", rainfall: "≈ 200 – 350 mm/an", risk: "secheresse" },
  { zone: "Hodh El Gharbi", dominant: "elevage", rainfall: "≈ 250 – 350 mm/an", risk: "secheresse" },
  { zone: "Hodh Ech Chargui", dominant: "elevage", rainfall: "≈ 200 – 400 mm/an", risk: "critique" },
  { zone: "Guidimakha", dominant: "mixte", rainfall: "≈ 400 – 600 mm/an", risk: "vigilance" },
];

const DOMINANT_LABEL = {
  fr: { agri: "Agriculture", elevage: "Élevage", mixte: "Agriculture & élevage" },
  ar: { agri: "الزراعة", elevage: "تربية الماشية", mixte: "الزراعة وتربية الماشية" },
};

const RISK_TO_FREQ = { normal: 20, vigilance: 35, secheresse: 50, severe: 62, critique: 75 };
const DROUGHT_FREQ = ZONE_DETAILS.map(z => ({ zone: z.zone, freq: RISK_TO_FREQ[z.risk] }));

const PREMIUM_VS_INDEMNITY = [
  { s: "Sc. 1", prime: 4200, indemnite: 0 },
  { s: "Sc. 2", prime: 4200, indemnite: 12500 },
  { s: "Sc. 3", prime: 4200, indemnite: 25000 },
  { s: "Sc. 4", prime: 4200, indemnite: 50000 },
  { s: "Sc. 5", prime: 4200, indemnite: 100000 },
];

const PIE_COLORS = [C.blue, C.blueLight, C.gold, C.orange];

/* ============================================================
   HELPERS — déplacés dans ./components/shared (importés ci-dessus)
   ============================================================ */

/* ============================================================
   MAIN APP
   ============================================================ */
/* ============================================================
   PUBLIC SURVEY RESULTS — read-only, aggregated, anonymous.
   Reads ONLY from the `public_survey_results` Supabase view (anon key,
   no service role, no admin login). This platform never sees individual
   answers, respondent identity, or admin data — that lives in the
   separate Survey Platform / admin dashboard.
   ============================================================ */
const SURVEY_SLUG = "assurance-parametrique-2026";
const PUBLIC_RESULTS_COLORS = [C.blue, C.blueLight, C.gold, C.orange, C.green, C.red];

function PublicSurveyResults({ lang, s }) {
  const [rows, setRows] = useState(null);
  const [participants, setParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data: surveyRow, error: sErr } = await supabase
        .from("surveys")
        .select("id")
        .eq("slug", SURVEY_SLUG)
        .eq("active", true)
        .single();
      if (sErr || !surveyRow) throw sErr || new Error("no survey");

      const { data: resultRows, error: rErr } = await supabase
        .from("public_survey_results")
        .select("*")
        .eq("survey_id", surveyRow.id)
        .order("question_sort_order", { ascending: true })
        .order("option_sort_order", { ascending: true });
      if (rErr) throw rErr;
      setRows(resultRows || []);

      const { data: pc, error: pErr } = await supabase
        .from("public_survey_participant_counts")
        .select("total_participants")
        .eq("survey_id", surveyRow.id)
        .maybeSingle();
      if (!pErr) setParticipants(pc?.total_participants || 0);
    } catch (_) {
      setError(s.errorLoad);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("official-survey-results-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "survey_responses" }, () => load())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "survey_answers" }, () => load())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "survey_questions" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byQuestion = React.useMemo(() => {
    if (!rows) return [];
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.question_id)) {
        map.set(r.question_id, {
          question: lang === "ar" ? r.question_ar : r.question_fr,
          options: [],
        });
      }
      map.get(r.question_id).options.push({
        name: lang === "ar" ? r.option_label_ar : r.option_label_fr,
        v: r.response_count,
        pct: r.percentage,
      });
    }
    return Array.from(map.values());
  }, [rows, lang]);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="text-sm font-semibold" style={{ color: C.navy }}>
          {s.totalResponses}: <span style={{ color: C.blue }}>{participants}</span>
        </div>
        <button onClick={load} className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.blue }}>
          <Repeat size={13} /> {s.refresh}
        </button>
      </div>

      {loading && <p className="text-sm" style={{ color: C.slate }}>{s.loading}</p>}
      {error && !loading && <p className="text-sm font-medium" style={{ color: C.red }}>{error}</p>}

      {!loading && !error && participants === 0 && (
        <Card className="text-center py-10">
          <p className="text-sm" style={{ color: C.slate }}>{s.noResponses}</p>
        </Card>
      )}

      {!loading && !error && participants > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {byQuestion.map((q, qi) => (
            <Card key={qi}>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{q.question}</div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={q.options} dataKey="v" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({ name, pct }) => `${name}: ${pct}%`}>
                    {q.options.map((_, idx) => <Cell key={idx} fill={PUBLIC_RESULTS_COLORS[idx % PUBLIC_RESULTS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   LIVE WEATHER — real data from the public Open-Meteo API (no key needed)
   ============================================================ */
function LiveWeatherWidget({ lang, dir, w, zone, setZone }) {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [projection, setProjection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);

  const addYears = (date, years) => {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCFullYear(d.getUTCFullYear() + years);
    return d.toISOString().slice(0, 10);
  };

  const yearStart = (year) => `${year}-01-01`;
  const yearEnd = (year) => `${year}-12-31`;

  const addDays = (date, days) => {
    const d = new Date(date + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const today = () => new Date().toISOString().slice(0, 10);

  function aggregateYears(times, temps, precs) {
    const map = new Map();
    times.forEach((date, i) => {
      const year = String(date).slice(0, 4);
      if (!map.has(year)) map.set(year, { year, t: [], rain: 0, n: 0 });
      const row = map.get(year);
      const t = Number(temps?.[i]);
      const p = Number(precs?.[i]);
      if (Number.isFinite(t)) row.t.push(t);
      if (Number.isFinite(p)) row.rain += p;
      row.n += 1;
    });
    return [...map.values()].map(x => ({
      year: x.year,
      temp: x.t.length ? x.t.reduce((a,b)=>a+b,0)/x.t.length : null,
      rain: x.rain,
    }));
  }

  async function fetchWeather(z) {
    setLoading(true);
    setError(null);
    try {
      const coords = ZONE_COORDS[z];
      const now = today();
      const currentYear = Number(now.slice(0, 4));
      // Exactly five complete calendar years for the historical panel.
      const pastStart = yearStart(currentYear - 5);
      const pastEnd = yearEnd(currentYear - 1);
      // Exactly five complete future calendar years for the climate projection panel.
      const futureStart = yearStart(currentYear + 1);
      const futureEnd = yearEnd(currentYear + 5);
      const nearUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=precipitation_sum,temperature_2m_max,temperature_2m_min&past_days=7&forecast_days=16&timezone=auto`;
      const histUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${pastStart}&end_date=${pastEnd}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
      const climateUrl = `https://climate-api.open-meteo.com/v1/climate?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${futureStart}&end_date=${futureEnd}&models=EC_Earth3P_HR&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
      const [nearRes, histRes, climateRes] = await Promise.all([fetch(nearUrl), fetch(histUrl), fetch(climateUrl)]);
      if (!nearRes.ok || !histRes.ok || !climateRes.ok) throw new Error("network");
      const [near, hist, climate] = await Promise.all([nearRes.json(), histRes.json(), climateRes.json()]);
      setData(near);
      setHistory(aggregateYears(hist.daily?.time || [], hist.daily?.temperature_2m_mean || [], hist.daily?.precipitation_sum || []));
      setProjection(aggregateYears(climate.daily?.time || [], climate.daily?.temperature_2m_mean || [], climate.daily?.precipitation_sum || []));
      setUpdatedAt(new Date());
    } catch (_) {
      setError(w.error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchWeather(zone); /* eslint-disable-next-line */ }, [zone]);

  const past7Precip = useMemo(() => {
    if (!data?.daily) return null;
    const times = data.daily.time || [];
    const precs = data.daily.precipitation_sum || [];
    const todayIdx = times.length - 16;
    let sum = 0;
    for (let i = 0; i < todayIdx && i < precs.length; i++) sum += Number(precs[i] || 0);
    return sum;
  }, [data]);

  const forecastDays = useMemo(() => {
    if (!data?.daily) return [];
    const times = data.daily.time || [];
    const tmax = data.daily.temperature_2m_max || [];
    const tmin = data.daily.temperature_2m_min || [];
    const prec = data.daily.precipitation_sum || [];
    const todayDate = today();
    const firstFutureIdx = times.findIndex((date) => date >= todayDate);
    const startIdx = firstFutureIdx >= 0 ? firstFutureIdx : Math.max(0, times.length - 16);
    return times.slice(startIdx, startIdx + 16).map((date, k) => {
      const i = startIdx + k;
      return { date, tmax: tmax[i], tmin: tmin[i], precip: prec[i] };
    });
  }, [data]);

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2"><CloudRain size={18} style={{ color: C.blue }} /><span className="font-bold text-sm" style={{ color: C.navy }}>{w.title}</span></div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full text-white shadow-sm" style={{ background: `linear-gradient(135deg, #23A06E, ${C.green})` }}><span className="w-1.5 h-1.5 rounded-full bg-white pulse-dot" /> {w.live}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="flex-1 min-w-[160px]"><label className="text-xs font-semibold mb-1.5 block" style={{ color: C.navy }}>{w.zoneLabel}</label><select value={zone} onChange={(e) => setZone(e.target.value)} className="select-polished w-full border rounded-lg px-3 py-2 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>{ZONES.map(z => <option key={z} value={z}>{lang === "ar" ? ZONE_AR[z] : z}</option>)}</select></div>
        <button onClick={() => fetchWeather(zone)} className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 hover:-translate-y-px hover:shadow-md" style={{ borderColor: `${C.blue}55`, color: C.blue, backgroundColor: C.blueSoft }}><Repeat size={13} /> {w.refresh}</button>
      </div>
      <div className="text-xs mb-4" style={{ color: C.slateLight }}>{w.capital}: {ZONE_COORDS[zone].capital}</div>
      {loading && <p className="text-sm" style={{ color: C.slate }}>{w.loading}</p>}
      {error && !loading && <div className="rounded-lg p-4 border" style={{ borderColor: C.border, backgroundColor: C.ivory }}><p className="text-sm mb-4" style={{ color: C.slate }}>{error}</p><div className="flex flex-wrap gap-2"><a href={`https://www.windy.com/${ZONE_COORDS[zone].lat}/${ZONE_COORDS[zone].lon}?${ZONE_COORDS[zone].lat},${ZONE_COORDS[zone].lon},7`} target="_blank" rel="noopener noreferrer" className="px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5" style={{ backgroundColor: C.blue, color: C.white }}><ExternalLink size={13} /> {w.openLive}</a></div></div>}
      {!loading && !error && data?.current && <>
        <div className="grid sm:grid-cols-3 gap-4 mb-5">
          <div className="rounded-lg p-4" style={{ backgroundColor: C.blueSoft }}><div className="text-xs mb-1" style={{ color: C.blue }}>{w.temp}</div><div className="font-bold text-xl" style={{ color: C.navy }}>{data.current.temperature_2m}°C</div></div>
          <div className="rounded-lg p-4" style={{ backgroundColor: C.ivory }}><div className="text-xs mb-1" style={{ color: C.slateLight }}>{w.humidity}</div><div className="font-bold text-xl" style={{ color: C.navy }}>{data.current.relative_humidity_2m}%</div></div>
          <div className="rounded-lg p-4" style={{ backgroundColor: C.ivory }}><div className="text-xs mb-1" style={{ color: C.slateLight }}>{w.wind}</div><div className="font-bold text-xl" style={{ color: C.navy }}>{data.current.wind_speed_10m} km/h</div></div>
        </div>
        <div className="rounded-lg p-4 mb-5" style={{ backgroundColor: C.greenSoft }}><div className="text-xs mb-1" style={{ color: C.green }}>{w.precip7d}</div><div className="font-bold text-lg" style={{ color: C.navy }}>{past7Precip !== null ? `${past7Precip.toFixed(1)} mm` : "—"}</div></div>
        <div className="text-xs font-semibold mb-2" style={{ color: C.navy }}>{w.forecastTitle}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">{forecastDays.map((d, i) => <div key={i} className="rounded-lg p-3 text-center border" style={{ borderColor: C.border }}><div className="text-[11px] mb-1" style={{ color: C.slateLight }}>{d.date}</div><div className="text-sm font-semibold" style={{ color: C.navy }}>{Math.round(d.tmin)}° / {Math.round(d.tmax)}°</div><div className="text-[11px] mt-1" style={{ color: C.blue }}>{d.precip} mm</div></div>)}</div>

        <div className="border-t pt-5 mb-6" style={{ borderColor: C.border }}>
          <div className="text-sm font-bold mb-2" style={{ color: C.navy }}>{w.past5Title}</div>
          <p className="text-xs mb-3" style={{ color: C.slateLight }}>{w.yearly} · {history.length} années complètes</p>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis yAxisId="temp" /><YAxis yAxisId="rain" orientation="right" /><Tooltip /><Legend /><Line yAxisId="temp" type="monotone" dataKey="temp" name={w.tempYear + " (°C)"} /><Line yAxisId="rain" type="monotone" dataKey="rain" name={w.rainYear + " (mm)"} /></LineChart></ResponsiveContainer></div>
        </div>

        <div className="border-t pt-5" style={{ borderColor: C.border }}>
          <div className="text-sm font-bold mb-2" style={{ color: C.navy }}>{w.future5Title}</div>
          <p className="text-xs mb-3" style={{ color: C.slateLight }}>{w.futureNote} · {projection.length} années complètes</p>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={projection}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis yAxisId="temp" /><YAxis yAxisId="rain" orientation="right" /><Tooltip /><Legend /><Line yAxisId="temp" type="monotone" dataKey="temp" name={w.tempYear + " (°C)"} /><Line yAxisId="rain" type="monotone" dataKey="rain" name={w.rainYear + " (mm)"} /></LineChart></ResponsiveContainer></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] pt-4 mt-5 border-t" style={{ borderColor: C.border, color: C.slateLight }}><span>{w.source}</span>{updatedAt && <span>{w.updated}: {updatedAt.toLocaleTimeString(lang === "ar" ? "ar-MR" : "fr-FR")}</span>}</div>
      </>}
    </Card>
  );
}

export default function ParametricInsurancePlatform() {
  const [lang, setLang] = useState("fr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [paramTab, setParamTab] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [resultsTab, setResultsTab] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState("home");

  // Simulator state
  const [sector, setSector] = useState("agri");
  const [zone, setZone] = useState(ZONES[0]);
  const [weatherZone, setWeatherZone] = useState(ZONES[0]);
  const [capital, setCapital] = useState(100000);
  const [climateIndex, setClimateIndex] = useState(72);
  const [coverage, setCoverage] = useState(100);
  const [probability, setProbability] = useState(30);
  const [severity, setSeverity] = useState(45);
  const [feeRate, setFeeRate] = useState(15);
  const [reinsRate, setReinsRate] = useState(10);
  const [margin, setMargin] = useState(10);

  // Composite index weights
  const [wPrecip, setWPrecip] = useState(40);
  const [wNdvi, setWNdvi] = useState(30);
  const [wHumid, setWHumid] = useState(30);

  // Hypothèses financières + équipe (Supabase / localStorage)
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [team, setTeam] = useState([]);

  // Espace superviseur — accès protégé par Supabase Auth + admin_profiles
  const [adminOpen, setAdminOpen] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const clickCount = useRef(0);
  const clickTimer = useRef(null);
  const [logoPulse, setLogoPulse] = useState(false);

  const handleLogoClick = () => {
    scrollTo("home");
    clickCount.current += 1;
    setLogoPulse(true);
    setTimeout(() => setLogoPulse(false), 350);
    clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 1600);
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      setAdminOpen(true);
    }
  };

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const [nextAssumptions, nextTeam] = await Promise.all([loadAssumptions(), loadTeam()]);
        if (!alive) return;
        setAssumptions(nextAssumptions); setTeam(nextTeam);
      } catch (err) { console.error("APC data refresh failed", err); }
    };
    refresh();
    const onFocus = () => refresh();
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(refresh, 30000);
    return () => { alive = false; window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onVisibility); window.clearInterval(timer); };
  }, []);

  const handleSaveAssumptions = async (draft, authed) => {
    const saved = await saveAssumptions(draft, authed);
    setAssumptions({ ...saved });
    return saved;
  };

  const t = T[lang];
  const x = EXT[lang];
  const dir = t.dir;
  const RISK_LABELS = lang === "ar" ? RISK_LABELS_AR : RISK_LABELS_FR;

  const risk = useMemo(() => riskFromIndex(climateIndex), [climateIndex]);
  const indemnPct = useMemo(() => Math.min(100, (risk.pct * coverage) / 100), [risk, coverage]);
  const indemnAmount = useMemo(() => (capital * indemnPct) / 100, [capital, indemnPct]);
  const purePremium = useMemo(() => (capital * (probability / 100) * (severity / 100)), [capital, probability, severity]);
  const commercialPremium = useMemo(() => purePremium * (1 + feeRate / 100 + reinsRate / 100 + margin / 100), [purePremium, feeRate, reinsRate, margin]);
  const potentialLoss = useMemo(() => capital * (severity / 100), [capital, severity]);
  const ratio = useMemo(() => (commercialPremium > 0 ? indemnAmount / commercialPremium : 0), [indemnAmount, commercialPremium]);

  const navItems = [
    ["home", t.nav.home], ["dashboard", x.nav.dashboard], ["synthese", lang === "ar" ? "خلاصة الجدوى" : "Synthèse"], ["etude", t.nav.etude],
    ["marche", x.nav.marche], ["risques", t.nav.risques],
    ["parametrique", t.nav.parametrique], ["technique", x.nav.technique],
    ["financier", x.nav.financier], ["declenchement", lang === "ar" ? "التفعيل" : "Déclenchement"],
    ["simulateur", t.nav.simulateur], ["scenarios", x.nav.scenarios],
    ["sensibilite", x.nav.sensibilite], ["resultats", t.nav.resultats],
    ["equipe", x.nav.equipe], ["methodologie", t.nav.methodologie],
    ["conclusion", x.nav.conclusion], ["apropos", t.nav.apropos],
  ];

  const scrollTo = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* document lang/dir + scroll state */
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(100, (y / max) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* scrollspy */
  useEffect(() => {
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveSection(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    navItems.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
    return () => spy.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // بوابة الوصول: لا تُعرض الواجهة الرئيسية إلا بعد مصادقة المشرف.
  // لا يتم تعديل قاعدة البيانات أو أي من وظائف المنصة الحالية.
  if (!accessGranted) {
    return (
      <AdminPanel
        open={true}
        gateMode={true}
        onAuthenticated={() => { setAccessGranted(true); setAdminOpen(true); }}
        onUnauthenticated={() => { setAccessGranted(false); setAdminOpen(false); }}
        onClose={() => {}}
        onLangChange={() => setLang(l => l === "fr" ? "ar" : "fr")}
        lang={lang}
        dir={dir}
        x={x.admin}
        finance={x.financier}
        assumptions={assumptions}
        onSaveAssumptions={handleSaveAssumptions}
        team={team}
        onTeamChange={setTeam}
      />
    );
  }

  return (
    <div dir={dir} style={{ backgroundColor: C.ivory, color: C.ink, fontFamily: "var(--font-body)" }} className="min-h-screen w-full">

      {/* NAVBAR */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "shadow-[0_10px_36px_-16px_rgba(11,30,57,0.25)]" : ""}`}
        style={{
          backgroundColor: scrolled ? "rgba(255,255,255,0.88)" : "rgba(255,255,255,0.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: `1px solid ${scrolled ? "transparent" : C.border}`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <button onClick={handleLogoClick} className={`flex items-center gap-2.5 shrink-0 group transition-transform duration-300 ${logoPulse ? "scale-95" : ""}`} aria-label="APC Mauritanie">
            <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3 rounded-xl"
              style={{ boxShadow: logoPulse ? `0 0 0 3px ${C.gold}55` : "none", borderRadius: 12 }}>
              <Logo variant="compact" theme="dark" size={38} />
            </div>
            <span className="hidden sm:flex flex-col items-start leading-none">
              <span className="font-extrabold text-[13px] tracking-tight whitespace-nowrap" style={{ color: C.navy }}>APC · Mauritanie</span>
              <span className="text-[9.5px] font-semibold tracking-[0.14em] uppercase mt-1 whitespace-nowrap" style={{ color: C.gold }}>{t.badgeAcademicShort}</span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-0 overflow-x-auto min-w-0 flex-1 justify-center px-1">
            {navItems.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`nav-link px-2 py-2 text-[11.5px] xl:text-[12px] font-medium rounded-lg whitespace-nowrap ${activeSection === id ? "active" : ""}`}
                style={{ color: C.slate }}>
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(l => (l === "fr" ? "ar" : "fr"))}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all duration-300 hover:shadow-md hover:-translate-y-px whitespace-nowrap"
              style={{ borderColor: `${C.blue}66`, color: C.blue, backgroundColor: `${C.blueSoft}80` }}
            >
              <Globe size={13} />
              {lang === "fr" ? "FR | العربية" : "العربية | FR"}
            </button>
            <button className="lg:hidden p-2 rounded-lg transition-colors hover:bg-black/5" style={{ color: C.navy }} onClick={() => setMenuOpen(o => !o)}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* reading progress */}
        <div className="absolute bottom-0 start-0 h-[2.5px] rounded-full transition-[width] duration-150"
          style={{ width: `${scrollProgress}%`, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})` }} />

        {menuOpen && (
          <div className="lg:hidden border-t px-4 py-3 flex flex-col gap-1" style={{ borderColor: C.border, backgroundColor: "rgba(255,255,255,0.96)", backdropFilter: "blur(14px)" }}>
            {navItems.map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={`text-start px-3 py-2.5 text-sm font-medium rounded-lg transition-colors hover:bg-black/5 ${activeSection === id ? "bg-black/5" : ""}`}
                style={{ color: activeSection === id ? C.navy : C.slate }}>
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden" style={{ backgroundColor: C.navyDeep }}>
        {/* layered background */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(155deg, ${C.navyDeep} 0%, ${C.navy} 48%, ${C.navyLight} 100%)` }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(52rem 30rem at 85% -10%, rgba(176,138,62,0.22), transparent 62%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(46rem 28rem at -12% 112%, rgba(59,111,174,0.30), transparent 62%)" }} />
        <div className="absolute inset-0 opacity-[0.13]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 85% 75% at 50% 28%, black 25%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 75% at 50% 28%, black 25%, transparent 78%)",
        }} />
        {/* floating orbs */}
        <div className="absolute -top-24 -end-24 w-96 h-96 rounded-full float-slow pointer-events-none" style={{ background: "radial-gradient(circle, rgba(217,188,122,0.16), transparent 65%)", filter: "blur(8px)" }} />
        <div className="absolute bottom-0 -start-32 w-[28rem] h-[28rem] rounded-full float-slower pointer-events-none" style={{ background: "radial-gradient(circle, rgba(59,111,174,0.22), transparent 65%)", filter: "blur(8px)" }} />
        {/* contour rings */}
        <svg className="absolute top-1/2 -translate-y-1/2 end-0 hidden lg:block pointer-events-none" width="520" height="520" viewBox="0 0 520 520" fill="none" style={{ opacity: 0.5 }}>
          {[90, 150, 210, 268].map((r) => (
            <circle key={r} cx="420" cy="260" r={r} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          ))}
          <circle cx="420" cy="260" r="150" stroke="rgba(217,188,122,0.28)" strokeWidth="1" strokeDasharray="3 7" />
          <circle cx="558" cy="146" r="5" fill={C.goldLight} opacity="0.85" />
          <circle cx="300" cy="408" r="4" fill="#5B87C4" opacity="0.9" />
          <circle cx="262" cy="176" r="3" fill="rgba(255,255,255,0.5)" />
        </svg>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-20 md:pb-28 relative">
          <span className="hero-rise inline-flex items-center gap-2 text-[11px] md:text-xs font-bold tracking-wide px-4 py-2 rounded-full mb-7 border" style={{ color: C.goldLight, borderColor: "rgba(176,138,62,0.4)", backgroundColor: "rgba(176,138,62,0.1)" }}>
            <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: C.goldLight }} />
            {t.hero.kicker}
          </span>

          <h1 className="hero-rise-1 text-4xl md:text-6xl font-bold max-w-4xl leading-[1.12] md:leading-[1.05] tracking-tight mb-5" style={{ color: C.white, fontFamily: "var(--font-display)" }}>
            {t.hero.title}
          </h1>
          <p className="hero-rise-2 text-lg md:text-2xl max-w-2xl mb-4 font-semibold text-gradient-gold" style={{ fontFamily: lang === "ar" ? "var(--font-display)" : undefined }}>{t.hero.subtitle}</p>
          <p className="hero-rise-3 max-w-2xl text-sm md:text-base leading-relaxed mb-9" style={{ color: "#A9BBD4" }}>{t.hero.desc}</p>

          <div className="hero-rise-4 flex flex-wrap gap-3 mb-12">
            <button onClick={() => scrollTo("etude")} className="btn-gold px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2" style={{ background: `linear-gradient(120deg, ${C.goldLight}, ${C.gold})`, color: C.navyDeep }}>
              {t.hero.cta1} <ArrowRight size={16} className={dir === "rtl" ? "rotate-180" : ""} />
            </button>
            <button onClick={() => scrollTo("simulateur")} className="btn-ghost-light px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 border" style={{ borderColor: "rgba(255,255,255,0.28)", color: C.white }}>
              <Calculator size={16} /> {t.hero.cta2}
            </button>
            <button onClick={() => scrollTo("dashboard")} className="btn-ghost-light px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 border" style={{ borderColor: "rgba(255,255,255,0.28)", color: C.white }}>
              <Gauge size={16} /> {x.hero.cta3}
            </button>
            <button onClick={() => scrollTo("financier")} className="btn-ghost-light px-6 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 border" style={{ borderColor: "rgba(255,255,255,0.28)", color: C.white }}>
              <Banknote size={16} /> {x.hero.cta4}
            </button>
          </div>

          {/* Chaîne paramétrique animée : Risque → Indice → Déclenchement → Indemnisation */}
          <div className="hero-rise-4 mb-12">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-3" style={{ color: C.goldLight }}>{x.hero.chainTitle}</div>
            <div className="flex flex-wrap items-center gap-2">
              {x.hero.chain.map((step, i) => {
                const ChainIcon = [CloudLightning, Gauge, Zap, Banknote][i];
                return (
                  <React.Fragment key={i}>
                    <div className="chain-step flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold border"
                      style={{
                        animationDelay: `${i * 0.45}s`,
                        borderColor: "rgba(217,188,122,0.35)",
                        color: C.white,
                        background: `linear-gradient(140deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03))`,
                      }}>
                      <ChainIcon size={15} style={{ color: C.goldLight }} />
                      {step}
                    </div>
                    {i < x.hero.chain.length - 1 && <ChevronRight size={15} style={{ color: C.gold }} className={dir === "rtl" ? "rotate-180" : ""} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* stats */}
          <div className="hero-rise-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-7 mb-12 max-w-3xl">
            {t.hero.stats.map(([v, l], i) => (
              <div key={i} className="border-s-2 ps-4" style={{ borderColor: "rgba(176,138,62,0.45)" }}>
                <div className="text-2xl md:text-[2rem] font-bold leading-none" style={{ color: C.white, fontFamily: "var(--font-display)" }}>{v}</div>
                <div className="text-[11px] md:text-xs mt-2 font-medium" style={{ color: "#93A7C4" }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Flow strip — signature element */}
          <div className="hero-rise-5 rounded-2xl p-4 md:p-5 border" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.045)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
            <div className="flex flex-wrap items-center gap-2">
              {t.hero.flow.map((step, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-medium border" style={{ borderColor: "rgba(255,255,255,0.1)", color: C.white, backgroundColor: "rgba(255,255,255,0.06)" }}>
                    <span className="w-4.5 h-4.5 min-w-[18px] min-h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: "rgba(176,138,62,0.22)", color: C.goldLight }}>{i + 1}</span>
                    {step}
                  </div>
                  {i < t.hero.flow.length - 1 && (
                    <ChevronRight size={15} style={{ color: C.gold }} className={dir === "rtl" ? "rotate-180" : ""} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* scroll cue */}
        <button onClick={() => scrollTo("etude")} aria-label="scroll" className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex bounce-soft" style={{ color: "#7E93B5" }}>
          <ChevronDown size={22} />
        </button>
        <div className="absolute bottom-0 inset-x-0 divider-glow" />
      </section>

      {/* DASHBOARD KPI */}
      <KpiDashboard x={x.dashboard} badges={x.badges} lang={lang} assumptions={assumptions} />

      {/* SYNTHÈSE UNIFIÉE */}
      <ResearchSynthesis lang={lang} assumptions={assumptions} />

      {/* ETUDE */}
      <section id="etude" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <SectionTitle eyebrow={t.etude.eyebrow} title={t.etude.title} />

        <Card className="mb-8">
          <h3 className="text-lg font-bold mb-3" style={{ color: C.navy }}>{t.etude.problTitle}</h3>
          <p className="text-sm leading-relaxed mb-6" style={{ color: C.slate }}>{t.etude.problText}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {t.etude.impacts.map((im, i) => {
              const Icon = ICONS[im.icon] || Info;
              return (
                <div key={i} className="rounded-xl p-4 border transition-colors hover:bg-white" style={{ borderColor: C.border, backgroundColor: C.ivory }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: C.blueSoft }}>
                    <Icon size={17} style={{ color: C.blue }} />
                  </div>
                  <div className="font-semibold text-sm" style={{ color: C.navy }}>{im.label}</div>
                  <div className="text-xs mt-1 leading-relaxed" style={{ color: C.slate }}>{im.text}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Reveal className="rounded-2xl p-6 md:p-8 mb-8 border-s-4 shadow-[0_10px_32px_-20px_rgba(27,78,140,0.35)]" style={{ background: `linear-gradient(120deg, ${C.blueSoft}, #F4F8FE)`, borderColor: C.blue }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] mb-2.5" style={{ color: C.blue }}>{t.etude.questionTitle}</div>
          <p className="text-base md:text-xl font-semibold leading-relaxed" style={{ color: C.navy, fontFamily: lang === "ar" ? "var(--font-body)" : "var(--font-display)" }}>{t.etude.question}</p>
        </Reveal>

        <h3 className="text-lg font-bold mb-4" style={{ color: C.navy }}>{t.etude.objTitle}</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.etude.objectives.map((o, i) => (
            <Card key={i} className="flex items-start gap-3.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.goldLight, border: `1px solid ${C.gold}44` }}>{i + 1}</span>
              <p className="text-sm leading-relaxed" style={{ color: C.slate }}>{o}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* MARCHÉ */}
      <MarcheSection x={x.marche} lang={lang} badges={x.badges} />

      {/* RISQUES */}
      <section id="risques" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <SectionTitle eyebrow={t.risques.eyebrow} title={t.risques.title} desc={t.risques.intro} />
            <SimBadge text={t.simBadge} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {t.risques.cards.map((c, i) => {
              const Icon = ICONS[c.icon] || Info;
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: C.blueSoft }}>
                      <Icon size={19} style={{ color: C.blue }} />
                    </div>
                    <RiskDot level={c.level} />
                  </div>
                  <div className="font-semibold text-sm mb-1" style={{ color: C.navy }}>{c.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: C.slate }}>{c.value}</div>
                </Card>
              );
            })}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.risques.levelsTitle}</div>
              <div className="flex flex-col gap-3">
                {t.risques.levels.map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <RiskDot level={l.c} />
                    <span className="text-sm" style={{ color: C.slate }}>{l.n}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="md:col-span-2">
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.risques.chartTitle}</div>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={RAINFALL_DATA}>
                  <defs>
                    <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={C.blue} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="precip" name="Précipitations (mm)" stroke={C.blue} fill="url(#precipGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="ndvi" name="NDVI (x100)" stroke={C.green} strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="mt-6">
            <LiveWeatherWidget lang={lang} dir={dir} w={t.weather} zone={weatherZone} setZone={setWeatherZone} />
          </div>
        </div>
      </section>

      {/* PARAMETRIQUE (comparaison + trigger + basisrisk + composite + reassurance + timeline) */}
      <section id="parametrique" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <SectionTitle eyebrow={t.parametrique.eyebrow} title={t.parametrique.title} desc={t.parametrique.intro} />

        <div className="flex flex-wrap gap-2 mb-8">
          {t.parametrique.tabs.map((tab, i) => (
            <button key={i} onClick={() => setParamTab(i)}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:-translate-y-px"
              style={paramTab === i ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, borderColor: C.navy, color: C.white, boxShadow: "0 8px 18px -8px rgba(11,30,57,0.5)" } : { borderColor: C.border, color: C.slate, backgroundColor: C.white }}>
              {tab}
            </button>
          ))}
        </div>

        {/* TAB 0: comparaison */}
        {paramTab === 0 && (
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: C.navy }}>{t.comparaison.title}</h3>
            <div className="overflow-x-auto">
              <table className="tbl w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.navy }}>
                    {t.comparaison.head.map((h, i) => (
                      <th key={i} className="text-start px-4 py-3 font-semibold text-white first:rounded-s-lg last:rounded-e-lg">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.comparaison.rows.map((row, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: C.border }}>
                      <td className="px-4 py-3 font-medium" style={{ color: C.navy }}>{row[0]}</td>
                      <td className="px-4 py-3" style={{ color: C.slate }}>{row[1]}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: C.blue }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 1: trigger/exit */}
        {paramTab === 1 && (
          <Card>
            <h3 className="text-lg font-bold mb-4" style={{ color: C.navy }}>{t.parametrique.trigger.title}</h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <div className="rounded-lg p-4 border-s-4" style={{ backgroundColor: C.greenSoft, borderColor: C.green }}>
                <Tip text={t.tooltips.trigger}><span className="font-semibold text-sm" style={{ color: C.navy }}>Trigger</span></Tip>
                <p className="text-xs mt-1" style={{ color: C.slate }}>{t.parametrique.trigger.triggerDef}</p>
              </div>
              <div className="rounded-lg p-4 border-s-4" style={{ backgroundColor: C.redSoft, borderColor: C.red }}>
                <Tip text={t.tooltips.exit}><span className="font-semibold text-sm" style={{ color: C.navy }}>Exit</span></Tip>
                <p className="text-xs mt-1" style={{ color: C.slate }}>{t.parametrique.trigger.exitDef}</p>
              </div>
            </div>
            <div className="overflow-x-auto mb-4">
              <table className="tbl w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: C.blueSoft }}>
                    {t.parametrique.trigger.head.map((h, i) => (
                      <th key={i} className="text-start px-4 py-3 font-semibold" style={{ color: C.navy }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.parametrique.trigger.rows.map((row, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: C.border }}>
                      <td className="px-4 py-3 font-medium flex items-center gap-2" style={{ color: C.navy }}>
                        <RiskDot level={["normal", "vigilance", "secheresse", "severe", "critique"][i]} /> {row[0]}
                      </td>
                      <td className="px-4 py-3" style={{ color: C.slate }}>{row[1]}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: C.blue }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs italic flex items-start gap-2" style={{ color: C.slateLight }}><Info size={14} className="shrink-0 mt-0.5" />{t.parametrique.trigger.note}</p>
          </Card>
        )}

        {/* TAB 2: basis risk */}
        {paramTab === 2 && (
          <Card>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: C.navy }}>
              <AlertTriangle size={18} style={{ color: C.orange }} /> {t.parametrique.basisRisk.title}
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: C.slate }}>{t.parametrique.basisRisk.text}</p>
            <div className="rounded-lg p-4 mb-6 border-s-4" style={{ backgroundColor: C.orangeSoft, borderColor: C.orange }}>
              <p className="text-sm italic" style={{ color: C.navy }}>{t.parametrique.basisRisk.example}</p>
            </div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: C.navy }}>{t.parametrique.basisRisk.solTitle}</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {t.parametrique.basisRisk.solutions.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: C.slate }}>
                  <CheckCircle2 size={16} style={{ color: C.green }} className="shrink-0 mt-0.5" /> {s}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 3: composite index */}
        {paramTab === 3 && (
          <Card>
            <h3 className="text-lg font-bold mb-2" style={{ color: C.navy }}>{t.parametrique.composite.title}</h3>
            <p className="text-sm leading-relaxed mb-2" style={{ color: C.slate }}>{t.parametrique.composite.text}</p>
            <SimBadge text={t.parametrique.composite.hypothesis} />
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <div className="font-semibold text-sm mb-3" style={{ color: C.navy }}>{t.parametrique.composite.agriLabel}</div>
                {[["Précipitations", wPrecip, setWPrecip], ["NDVI", wNdvi, setWNdvi], ["Humidité du sol", wHumid, setWHumid]].map(([label, val, setter], i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between text-xs mb-1" style={{ color: C.slate }}>
                      <span>{t.parametrique.composite.agriParts[i][0]}</span><span className="font-semibold">{val}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={val} onChange={(e) => setter(Number(e.target.value))} className="w-full" style={{ "--val": `${val}%` }} />
                  </div>
                ))}
                <div className="text-xs mt-2" style={{ color: (wPrecip + wNdvi + wHumid) === 100 ? C.green : C.orange }}>
                  {lang === "ar" ? "المجموع" : "Somme"}: {wPrecip + wNdvi + wHumid}%
                </div>
              </div>
              <div>
                <div className="font-semibold text-sm mb-3" style={{ color: C.navy }}>{t.parametrique.composite.pastLabel}</div>
                <div className="text-sm space-y-2" style={{ color: C.slate }}>
                  {t.parametrique.composite.pastParts.map((p, i) => (
                    <div key={i} className="flex justify-between border-b pb-2" style={{ borderColor: C.border }}>
                      <span>{p[0]}</span><span className="font-semibold" style={{ color: C.navy }}>{[40, 30, 30][i]}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 4: reassurance */}
        {paramTab === 4 && (
          <Card>
            <h3 className="text-lg font-bold mb-2" style={{ color: C.navy }}>
              <Tip text={t.tooltips.reassurance}>{t.parametrique.reassurance.title}</Tip>
            </h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: C.slate }}>{t.parametrique.reassurance.text}</p>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="space-y-2">
                {t.parametrique.reassurance.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: C.slate }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: C.blue }} /> {r}
                  </li>
                ))}
              </ul>
              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: C.navy }}>{t.parametrique.reassurance.chartTitle}</div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={[{ name: t.parametrique.reassurance.legend[0], value: 60 }, { name: t.parametrique.reassurance.legend[1], value: 40 }]}
                      dataKey="value" cx="50%" cy="50%" outerRadius={75} label>
                      <Cell fill={C.blue} /><Cell fill={C.gold} />
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 5: timeline */}
        {paramTab === 5 && (
          <Card>
            <h3 className="text-lg font-bold mb-6" style={{ color: C.navy }}>{t.parametrique.timeline.title}</h3>
            <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-2">
              {t.parametrique.timeline.steps.map((s, i) => (
                <React.Fragment key={i}>
                  <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-2 md:flex-1">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-md" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.goldLight, border: `1px solid ${C.gold}44` }}>{i + 1}</div>
                    <div className="text-sm font-medium" style={{ color: C.navy }}>{s}</div>
                  </div>
                  {i < t.parametrique.timeline.steps.length - 1 && (
                    <div className="hidden md:flex items-center justify-center mt-4">
                      <ChevronRight size={16} style={{ color: C.gold }} className={dir === "rtl" ? "rotate-180" : ""} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>
        )}
      </section>

      {/* ÉTUDE TECHNIQUE */}
      <TechniqueSection x={x.technique} lang={lang} dir={dir} />

      {/* ÉTUDE FINANCIÈRE */}
      <FinanceSection x={x.financier} lang={lang} badges={x.badges} assumptions={assumptions} />

      {/* MODÈLE DE DÉCLENCHEMENT */}
      <TriggerSimulator x={x.declenchement} lang={lang} />

      {/* AGRICOLE */}
      <section id="agricole" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionTitle eyebrow={t.agricole.eyebrow} title={t.agricole.title} />
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Sprout size={22} style={{ color: C.green }} />
                <span className="font-semibold" style={{ color: C.navy }}>{t.agricole.risk}</span>
              </div>
              <p className="text-sm mb-4" style={{ color: C.slate }}>{t.agricole.indicators}</p>
              <div className="flex flex-wrap gap-2">
                {t.agricole.indicList.map((it, i) => (
                  <span key={i} className="text-xs font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: C.greenSoft, color: C.green }}>{it}</span>
                ))}
              </div>
            </Card>
            <Card className="flex flex-col items-start justify-between">
              <div className="text-sm" style={{ color: C.slate }}>APA — Assurance Paramétrique Agricole</div>
              <button onClick={() => scrollTo("simulateur")} className="btn-navy mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.white }}>
                {t.agricole.cta} <ArrowRight size={14} className={dir === "rtl" ? "rotate-180" : ""} />
              </button>
            </Card>
          </div>
        </div>
      </section>

      {/* ELEVAGE */}
      <section id="elevage" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <SectionTitle eyebrow={t.elevage.eyebrow} title={t.elevage.title} />
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Beef size={22} style={{ color: C.orange }} />
              <span className="font-semibold" style={{ color: C.navy }}>{t.elevage.risk}</span>
            </div>
            <p className="text-sm mb-6" style={{ color: C.slate }}>{t.elevage.indicators}</p>
            <div className="text-sm font-semibold mb-3" style={{ color: C.navy }}>{t.elevage.ispTitle}</div>
            <div className="flex flex-col sm:flex-row gap-2">
              {t.elevage.ispScale.map((s, i) => {
                const colors = [C.green, "#D6A61A", C.orange, "#C4501F", C.red];
                return (
                  <div key={i} className="flex-1 text-center rounded-lg py-2.5 text-xs font-semibold shadow-sm transition-transform duration-300 hover:scale-[1.04]" style={{ background: `linear-gradient(160deg, ${colors[i]}, ${colors[i]}DD)`, color: C.white }}>
                    {s}
                  </div>
                );
              })}
            </div>
          </Card>
          <Card className="flex flex-col items-start justify-between">
            <div className="text-sm" style={{ color: C.slate }}>APP — Assurance Paramétrique Pastorale</div>
            <button onClick={() => scrollTo("simulateur")} className="btn-navy mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.white }}>
              {t.elevage.cta} <ArrowRight size={14} className={dir === "rtl" ? "rotate-180" : ""} />
            </button>
          </Card>
        </div>
      </section>

      {/* SIMULATEUR */}
      <section id="simulateur" className="relative py-20 md:py-24 overflow-hidden" style={{ backgroundColor: C.navyDeep }}>
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${C.navyDeep} 0%, ${C.navy} 55%, ${C.navyLight} 100%)` }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(42rem 26rem at 92% -5%, rgba(176,138,62,0.15), transparent 62%)" }} />
        <div className="absolute inset-0 opacity-[0.1]" style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 15%, black 20%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 15%, black 20%, transparent 78%)",
        }} />
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          <Reveal className="max-w-3xl mb-10 md:mb-12">
            <Eyebrow light>{t.simulateur.eyebrow}</Eyebrow>
            <h2 className="text-3xl md:text-[2.6rem] md:leading-[1.15] font-bold mb-4 text-white" style={{ fontFamily: "var(--font-display)" }}>{t.simulateur.title}</h2>
            <p className="text-sm md:text-base leading-relaxed" style={{ color: "#A9BBD4" }}>{t.simulateur.intro}</p>
          </Reveal>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Inputs */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 h-fit shadow-[0_28px_64px_-28px_rgba(0,0,0,0.55)]">
              <div className="mb-5">
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.navy }}>{t.simulateur.sector}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setSector("agri")} className="py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-300"
                    style={sector === "agri" ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.white, borderColor: C.navy, boxShadow: "0 10px 20px -10px rgba(11,30,57,0.55)" } : { borderColor: C.border, color: C.slate }}>
                    <Sprout size={14} /> {t.simulateur.sectorAgri}
                  </button>
                  <button onClick={() => setSector("elevage")} className="py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 border transition-all duration-300"
                    style={sector === "elevage" ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, color: C.white, borderColor: C.navy, boxShadow: "0 10px 20px -10px rgba(11,30,57,0.55)" } : { borderColor: C.border, color: C.slate }}>
                    <Beef size={14} /> {t.simulateur.sectorElevage}
                  </button>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.navy }}>{t.simulateur.zone}</label>
                <select value={zone} onChange={(e) => setZone(e.target.value)} className="select-polished w-full border rounded-lg px-3 py-2.5 text-sm bg-white" style={{ borderColor: C.border, color: C.navy }}>
                  {ZONES.map(z => <option key={z} value={z}>{lang === "ar" ? ZONE_AR[z] : z}</option>)}
                </select>
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold mb-2 block" style={{ color: C.navy }}>{t.simulateur.capital}</label>
                <input type="number" value={capital} min={0} step={1000} onChange={(e) => setCapital(Number(e.target.value) || 0)}
                  className="input-polished w-full border rounded-lg px-3 py-2.5 text-sm" style={{ borderColor: C.border, color: C.navy }} />
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-xs font-semibold mb-2.5" style={{ color: C.navy }}>
                  <span>{t.simulateur.index}</span><span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: C.blueSoft, color: C.blue }}>{climateIndex}%</span>
                </div>
                <input type="range" min={0} max={100} value={climateIndex} onChange={(e) => setClimateIndex(Number(e.target.value))} className="w-full" style={{ "--val": `${climateIndex}%` }} />
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-xs font-semibold mb-2.5" style={{ color: C.navy }}>
                  <span>{t.simulateur.coverage}</span><span className="px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ backgroundColor: C.blueSoft, color: C.blue }}>{coverage}%</span>
                </div>
                <input type="range" min={0} max={100} value={coverage} onChange={(e) => setCoverage(Number(e.target.value))} className="w-full" style={{ "--val": `${coverage}%` }} />
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-[0_28px_64px_-28px_rgba(0,0,0,0.55)]">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold" style={{ color: C.navy }}>
                  <Gauge size={18} /> {t.simulateur.resultTitle}
                </div>
                <SimBadge text={t.simulateur.example} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}>
                  <div className="text-xs mb-1" style={{ color: C.slateLight }}>{t.simulateur.riskLevel}</div>
                  <div className="flex items-center gap-2 font-bold text-lg" style={{ color: RISK_COLORS[risk.key] }}>
                    <RiskDot level={risk.key} /> {RISK_LABELS[risk.key]}
                  </div>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}>
                  <div className="text-xs mb-1" style={{ color: C.slateLight }}>{t.simulateur.triggered}</div>
                  <div className="font-bold text-lg flex items-center gap-2" style={{ color: risk.pct > 0 ? C.red : C.green }}>
                    {risk.pct > 0 ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    {risk.pct > 0 ? t.simulateur.triggeredYes : t.simulateur.triggeredNo}
                  </div>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: C.blueSoft, borderColor: `${C.blue}22` }}>
                  <div className="text-xs mb-1" style={{ color: C.blue }}>{t.simulateur.indemnPct}</div>
                  <div className="font-bold text-lg" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{indemnPct.toFixed(0)}%</div>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: C.greenSoft, borderColor: `${C.green}22` }}>
                  <div className="text-xs mb-1" style={{ color: C.green }}>{t.simulateur.indemnAmount}</div>
                  <div className="font-bold text-lg" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{fmtNumber(indemnAmount, lang)} MRU</div>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}>
                  <div className="text-xs mb-1" style={{ color: C.slateLight }}>{t.simulateur.premium}</div>
                  <div className="font-bold text-lg" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{fmtNumber(commercialPremium, lang)} MRU</div>
                </div>
                <div className="rounded-xl p-4 border" style={{ backgroundColor: C.ivory, borderColor: C.border }}>
                  <div className="text-xs mb-1" style={{ color: C.slateLight }}>{t.simulateur.ratio}</div>
                  <div className="font-bold text-lg" style={{ color: C.navy, fontFamily: "var(--font-display)" }}>{ratio.toFixed(2)}x</div>
                </div>
              </div>

              <button onClick={() => setShowDetail(o => !o)}
                className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: C.blue }}>
                <Calculator size={15} />
                {showDetail ? t.simulateur.detailBtnClose : t.simulateur.detailBtn}
                <ChevronDown size={15} className={showDetail ? "rotate-180 transition-transform" : "transition-transform"} />
              </button>

              {showDetail && (
                <div className="rounded-lg p-5 mb-6 text-sm space-y-4" style={{ backgroundColor: C.ivory }}>
                  <div className="font-bold" style={{ color: C.navy }}>{t.calc.title}</div>

                  <div>
                    <div className="font-semibold mb-1" style={{ color: C.navy }}>{t.calc.step1}</div>
                    <div style={{ color: C.slate }}>{t.simulateur.index} = {climateIndex}% → {RISK_LABELS[risk.key]} → {risk.pct}%</div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1" style={{ color: C.navy }}>{t.calc.step2}</div>
                    <div className="font-mono text-xs mb-1" style={{ color: C.blue }}>{t.calc.indemniteFormula}</div>
                    <div style={{ color: C.slate }}>= {fmtNumber(capital, lang)} × {indemnPct.toFixed(0)}% = <b>{fmtNumber(indemnAmount, lang)} MRU</b></div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1" style={{ color: C.navy }}>{t.calc.step3}</div>
                    <div className="font-mono text-xs mb-1" style={{ color: C.blue }}>{t.calc.purePremiumFormula}</div>
                    <div style={{ color: C.slate }}>= {fmtNumber(capital, lang)} × {probability}% × {severity}% = <b>{fmtNumber(purePremium, lang)} MRU</b></div>
                  </div>

                  <div>
                    <div className="font-semibold mb-1" style={{ color: C.navy }}>{t.calc.step4}</div>
                    <div className="font-mono text-xs mb-1" style={{ color: C.blue }}>{t.calc.commercialFormula}</div>
                    <div style={{ color: C.slate }}>
                      = {fmtNumber(purePremium, lang)} × (1 + {feeRate}% + {reinsRate}% + {margin}%) = <b>{fmtNumber(commercialPremium, lang)} MRU</b>
                    </div>
                  </div>
                  <p className="text-xs italic pt-2 border-t" style={{ color: C.slateLight, borderColor: C.border }}>{t.calc.simNote}</p>
                </div>
              )}

              <div className="border-t pt-5" style={{ borderColor: C.border }}>
                <div className="text-xs font-semibold mb-4" style={{ color: C.navy }}>{t.simulateur.premiumParamsTitle}</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    [t.simulateur.probability, probability, setProbability],
                    [t.simulateur.severity, severity, setSeverity],
                    [t.simulateur.feeRate, feeRate, setFeeRate],
                    [t.simulateur.reinsRate, reinsRate, setReinsRate],
                    [t.simulateur.margin, margin, setMargin],
                  ].map(([label, val, setter], i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1" style={{ color: C.slate }}>
                        <span>{label}</span><span className="font-semibold" style={{ color: C.navy }}>{val}%</span>
                      </div>
                      <input type="range" min={0} max={100} value={val} onChange={(e) => setter(Number(e.target.value))} className="w-full" style={{ "--val": `${val}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SCÉNARIOS */}
      <ScenariosSection x={x.scenarios} lang={lang} badges={x.badges} assumptions={assumptions} />

      {/* SENSIBILITÉ */}
      <SensibiliteSection x={x.sensibilite} lang={lang} badges={x.badges} assumptions={assumptions} />

      {/* RESULTATS + SONDAGE + CARTE */}
      <section id="resultats" className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <SectionTitle eyebrow={t.resultats.eyebrow} title={t.resultats.title} />
          <SimBadge text={t.dataSim} />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {[t.resultats.title, t.sondage.title, t.carte.title].map((tab, i) => (
            <button key={i} onClick={() => setResultsTab(i)}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:-translate-y-px"
              style={resultsTab === i ? { background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, borderColor: C.navy, color: C.white, boxShadow: "0 8px 18px -8px rgba(11,30,57,0.5)" } : { borderColor: C.border, color: C.slate, backgroundColor: C.white }}>
              {tab}
            </button>
          ))}
        </div>

        {resultsTab === 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.resultats.charts[0]}</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={RAINFALL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                  <Line type="monotone" dataKey="precip" stroke={C.blue} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.resultats.charts[1]}</div>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={RAINFALL_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="m" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                  <Line type="monotone" dataKey="ndvi" stroke={C.green} strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.resultats.charts[2]}</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={DROUGHT_FREQ}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="zone" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={50} /><YAxis tick={{ fontSize: 11 }} /><Tooltip />
                  <Bar dataKey="freq" fill={C.orange} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.resultats.charts[3]}</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={PREMIUM_VS_INDEMNITY}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="s" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Legend />
                  <Bar dataKey="prime" fill={C.blue} radius={[4, 4, 0, 0]} name="Prime" />
                  <Bar dataKey="indemnite" fill={C.green} radius={[4, 4, 0, 0]} name="Indemnité" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {resultsTab === 1 && <PublicSurveyResults lang={lang} s={t.sondage} />}

        {resultsTab === 2 && (
          <div>
            <Card className="mb-6">
              <p className="text-sm mb-4" style={{ color: C.slate }}>{t.carte.note}</p>
              <div className="rounded-xl p-8 flex items-center justify-center" style={{ backgroundColor: C.blueSoft, minHeight: 320 }}>
                <svg viewBox="0 0 440 300" className="w-full max-w-lg">
                  <rect x="30" y="30" width="380" height="240" rx="12" fill={C.white} stroke={C.blue} strokeWidth="2" strokeDasharray="6 4" />
                  <text x="220" y="52" textAnchor="middle" fontSize="11" fill={C.slateLight}>Mauritanie — schéma illustratif</text>
                  {ZONE_DETAILS.map((z, i) => {
                    const positions = [[90, 220], [150, 175], [190, 130], [270, 195], [110, 95], [330, 130], [55, 150]];
                    const [x, y] = positions[i];
                    return (
                      <g key={z.zone}>
                        <circle cx={x} cy={y} r="9" fill={RISK_COLORS[z.risk]} opacity="0.9" />
                        <text x={x} y={y + 22} textAnchor="middle" fontSize="9.5" fill={C.navy}>{lang === "ar" ? ZONE_AR[z.zone] : z.zone}</text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </Card>

            <Card>
              <div className="text-sm font-semibold mb-4" style={{ color: C.navy }}>{t.carte.title}</div>
              <div className="overflow-x-auto mb-4">
                <table className="tbl w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor: C.blueSoft }}>
                      {t.carte.tableHead.map((h, i) => (
                        <th key={i} className="text-start px-4 py-3 font-semibold" style={{ color: C.navy }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ZONE_DETAILS.map((z, i) => (
                      <tr key={i} className="border-b" style={{ borderColor: C.border }}>
                        <td className="px-4 py-3 font-medium" style={{ color: C.navy }}>{lang === "ar" ? ZONE_AR[z.zone] : z.zone}</td>
                        <td className="px-4 py-3" style={{ color: C.slate }}>{DOMINANT_LABEL[lang][z.dominant]}</td>
                        <td className="px-4 py-3" style={{ color: C.slate }}>{z.rainfall}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${RISK_COLORS[z.risk]}1A`, color: RISK_COLORS[z.risk] }}>
                            <RiskDot level={z.risk} /> {RISK_LABELS[z.risk]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs italic flex items-start gap-2" style={{ color: C.slateLight }}>
                <Info size={14} className="shrink-0 mt-0.5" /> {t.carte.climateNote}
              </p>
            </Card>
          </div>
        )}
      </section>

      {/* METHODOLOGIE + FAISABILITE */}
      <section id="methodologie" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionTitle eyebrow={t.methodologie.eyebrow} title={t.methodologie.title} />
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} style={{ color: C.blue }} />
                <span className="font-semibold" style={{ color: C.navy }}>{t.methodologie.quantTitle}</span>
              </div>
              <ul className="space-y-2">
                {t.methodologie.quant.map((q, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: C.slate }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: C.blue }} /> {q}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Users size={18} style={{ color: C.gold }} />
                <span className="font-semibold" style={{ color: C.navy }}>{t.methodologie.qualTitle}</span>
              </div>
              <ul className="space-y-2">
                {t.methodologie.qual.map((q, i) => (
                  <li key={i} className="text-sm flex items-start gap-2" style={{ color: C.slate }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: C.gold }} /> {q}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <SectionTitle eyebrow={t.faisabilite.eyebrow} title={t.faisabilite.title} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {t.faisabilite.cats.map((cat, i) => {
              const Icon = ICONS[cat.icon] || Info;
              return (
                <Card key={i}>
                  <Icon size={20} style={{ color: C.blue }} className="mb-3" />
                  <div className="font-semibold text-sm mb-3" style={{ color: C.navy }}>{cat.t}</div>
                  <ul className="space-y-1.5">
                    {cat.items.map((it, j) => (
                      <li key={j} className="text-xs flex items-start gap-1.5" style={{ color: C.slate }}>
                        <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: C.slateLight }} /> {it}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
          <p className="text-xs italic mt-6 flex items-start gap-2 max-w-3xl" style={{ color: C.slateLight }}>
            <Info size={14} className="shrink-0 mt-0.5" /> {t.faisabilite.note}
          </p>
        </div>
      </section>

      {/* ÉQUIPE */}
      <TeamSection x={x.equipe} team={team} badges={x.badges} />

      {/* GLOSSAIRE */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-20">
        <SectionTitle title={t.glossaryTitle} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["trigger", "exit", "basisRisk", "ndvi", "purePremium", "reassurance"].map((k) => (
            <Card key={k}>
              <div className="text-sm font-bold mb-1" style={{ color: C.navy }}>{k === "purePremium" ? (lang === "ar" ? "القسط الصافي" : "Prime pure") : k === "reassurance" ? (lang === "ar" ? "إعادة التأمين" : "Réassurance") : k === "basisRisk" ? "Basis Risk" : k === "ndvi" ? "NDVI" : k.charAt(0).toUpperCase() + k.slice(1)}</div>
              <div className="text-xs leading-relaxed" style={{ color: C.slate }}>{t.tooltips[k]}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* CONCLUSION */}
      <ConclusionSection x={x.conclusion} lang={lang} />

      {/* APROPOS */}
      <section id="apropos" className="py-16 md:py-20" style={{ backgroundColor: C.white }}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <SectionTitle eyebrow={t.apropos.eyebrow} title={t.apropos.title} />
          <Card className="mb-8 flex flex-wrap items-center gap-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md" style={{ background: `linear-gradient(135deg, ${C.navyLight}, ${C.navy})`, border: `1px solid ${C.gold}44` }}>
              <GraduationCap size={22} color={C.goldLight} />
            </div>
            <div>
              <div className="font-bold" style={{ color: C.navy }}>{t.apropos.project}</div>
              <div className="text-sm" style={{ color: C.slate }}>{t.apropos.specialty} · {t.apropos.level}</div>
              <div className="text-sm" style={{ color: C.slate }}>{t.apropos.school}</div>
            </div>
          </Card>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative overflow-hidden" style={{ backgroundColor: C.navyDeep }}>
        <div className="divider-glow" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(180deg, ${C.navyDeep}, ${C.navy} 130%)` }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(36rem 18rem at 85% 0%, rgba(176,138,62,0.1), transparent 60%)" }} />
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
            <div className="max-w-sm">
              <div className="flex items-center gap-2.5 mb-3">
                <Logo variant="compact" theme="dark" size={36} />
                <span className="font-extrabold text-sm tracking-tight text-white">APC · Mauritanie</span>
              </div>
              <div className="font-semibold text-white mb-1.5" style={{ fontFamily: "var(--font-display)" }}>{t.footer.line1}</div>
              <div className="text-xs leading-relaxed mb-3" style={{ color: "#8FA0BE" }}>{t.footer.line2}</div>
              <div className="text-xs font-semibold" style={{ color: "#C3CFE0" }}>المعهد العالي للمحاسبة وإدارة المؤسسات — ISCAE</div>
              <div className="text-[11px]" style={{ color: "#8FA0BE" }}>Institut Supérieur de Comptabilité et d'Administration des Entreprises</div>
              <div className="text-[11px] mt-2" style={{ color: "#8FA0BE" }}>Nouakchott, Mauritanie · contact@apc-mauritanie.example</div>
              <button
                onClick={() => setLang(l => (l === "fr" ? "ar" : "fr"))}
                className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold border transition-all hover:-translate-y-px"
                style={{ borderColor: "rgba(255,255,255,0.2)", color: C.goldLight }}>
                <Globe size={12} /> {lang === "fr" ? "العربية" : "Français"}
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2.5 md:max-w-md md:justify-end">
              {navItems.filter(([id]) => id !== "home").map(([id, label]) => (
                <button key={id} onClick={() => scrollTo(id)} className="text-xs transition-colors duration-200 hover:text-white" style={{ color: "#B9C6DA" }}>{label}</button>
              ))}
            </div>
          </div>
          <div className="border-t pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs" style={{ borderColor: "rgba(255,255,255,0.09)", color: "#8FA0BE" }}>
            <span>{t.footer.rights}</span>
            <span className="font-bold text-gradient-gold">{t.footer.dev}</span>
          </div>
        </div>
      </footer>

      {/* ESPACE SUPERVISEUR — accès protégé */}
      <AdminPanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        onLangChange={() => setLang(l => l === "fr" ? "ar" : "fr")}
        onUnauthenticated={() => { setAccessGranted(false); setAdminOpen(false); }}
        lang={lang}
        dir={dir}
        x={x.admin}
        finance={x.financier}
        assumptions={assumptions}
        onSaveAssumptions={handleSaveAssumptions}
        team={team}
        onTeamChange={setTeam}
      />
    </div>
  );
}
