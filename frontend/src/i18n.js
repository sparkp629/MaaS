import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  fr: {
    translation: {
      slogan: 'Match votre repo GitHub avec des KOLs ciblés — Génération de contenu différenciateur.',
      connectGithub: 'Connecter GitHub',
      connecting: 'Connexion...',
      dashboard: 'Dashboard MaaS',
      overview: 'Vue d\'ensemble de votre Mindshare-as-a-Service',
      mindshareIndex: 'Mindshare Index',
      evolution: 'Évolution du Mindshare Index',
      topKols: 'Top 5 KOLs par Score de Compatibilité',
      activeCampaigns: 'Campagnes Actives',
      generate: 'Générer',
      loading: 'Chargement...',
    },
  },
  en: {
    translation: {
      slogan: 'Match your GitHub repo with targeted KOLs — Differentiating content generation.',
      connectGithub: 'Connect GitHub',
      connecting: 'Connecting...',
      dashboard: 'MaaS Dashboard',
      overview: 'Overview of your Mindshare-as-a-Service',
      mindshareIndex: 'Mindshare Index',
      evolution: 'Mindshare Index Evolution',
      topKols: 'Top 5 KOLs by Compatibility Score',
      activeCampaigns: 'Active Campaigns',
      generate: 'Generate',
      loading: 'Loading...',
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [],
    },
  });

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language || 'fr';
}

export default i18n;
