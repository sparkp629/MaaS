const Database = require('better-sqlite3');
const path = require('path');

function resolveDbPath() {
  const configuredPath = process.env.DATABASE_PATH;
  if (configuredPath && configuredPath.trim()) {
    return path.resolve(configuredPath.trim());
  }
  return path.join(__dirname, '..', 'maas.db');
}

function initDB() {
  const dbPath = resolveDbPath();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // ===== SCHEMA =====
  db.exec(`
    CREATE TABLE IF NOT EXISTS kols (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      handle TEXT NOT NULL UNIQUE,
      platform TEXT DEFAULT 'twitter',
      followers INTEGER DEFAULT 0,
      niche TEXT,
      avg_engagement_rate REAL DEFAULT 0,
      growth_velocity REAL DEFAULT 0,
      audience_overlap REAL DEFAULT 0,
      tech_promo_ratio REAL DEFAULT 0,
      publish_frequency REAL DEFAULT 0,
      conversion_rate REAL DEFAULT 0,
      sentiment_score REAL DEFAULT 0,
      niche_authority REAL DEFAULT 0,
      format_diversity REAL DEFAULT 0,
      audience_retention REAL DEFAULT 0,
      compatibility_score REAL DEFAULT 0,
      psychographic_tone TEXT DEFAULT 'informatif',
      bio TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS market_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      niche TEXT NOT NULL,
      opportunity_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      potential_reach INTEGER DEFAULT 0,
      competition_level TEXT DEFAULT 'moyen',
      trending_score REAL DEFAULT 0,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS segments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      mindshare_need REAL DEFAULT 0,
      ad_budget_level TEXT DEFAULT 'faible',
      market_size TEXT,
      growth_rate REAL DEFAULT 0,
      example_tools TEXT,
      opportunity_score REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS competitor_weaknesses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agency_type TEXT NOT NULL,
      weakness TEXT NOT NULL,
      severity INTEGER DEFAULT 5,
      description TEXT,
      maas_solution TEXT,
      impact_area TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      niche TEXT,
      status TEXT DEFAULT 'draft',
      kol_ids TEXT,
      hook TEXT,
      thread_content TEXT,
      bip_content TEXT,
      cta_content TEXT,
      short_content TEXT,
      mindshare_index REAL DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      roi_percent REAL DEFAULT 0,
      budget REAL DEFAULT 0,
      revenue_generated REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mindshare_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaign_id INTEGER,
      date TEXT NOT NULL,
      twitter_impressions INTEGER DEFAULT 0,
      twitter_engagement REAL DEFAULT 0,
      newsletter_opens INTEGER DEFAULT 0,
      newsletter_ctr REAL DEFAULT 0,
      youtube_views INTEGER DEFAULT 0,
      twitch_viewers INTEGER DEFAULT 0,
      brand_mentions INTEGER DEFAULT 0,
      sentiment REAL DEFAULT 0,
      mindshare_index REAL DEFAULT 0,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ===== SEED DATA =====
  const kolCount = db.prepare('SELECT COUNT(*) as c FROM kols').get().c;
  if (kolCount === 0) {
    seedDatabase(db);
  }

  return db;
}

function seedDatabase(db) {
  console.log('[MaaS] Seed de la base de données...');

  // ----- KOLs -----
  const insertKol = db.prepare(`
    INSERT INTO kols (name, handle, platform, followers, niche, avg_engagement_rate,
      growth_velocity, audience_overlap, tech_promo_ratio, publish_frequency,
      conversion_rate, sentiment_score, niche_authority, format_diversity,
      audience_retention, compatibility_score, psychographic_tone, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const kols = [
    ['Marc Developer', '@marcdev_ai', 'twitter', 8200, 'AI Tools', 7.8, 12.5, 0.15, 0.82, 4.2, 3.1, 78, 85, 0.7, 72, 0, 'technique', 'Dev fullstack passionné par l\'IA'],
    ['Sophie CodeGen', '@sophiecode', 'twitter', 4500, 'Code Generation', 9.2, 18.3, 0.08, 0.91, 5.1, 4.5, 85, 79, 0.8, 81, 0, 'informatif', 'Créatrice de contenu dev & IA'],
    ['Alex SaaS Builder', '@alexsaas', 'twitter', 15200, 'SaaS', 5.4, 8.7, 0.22, 0.75, 3.8, 2.8, 72, 88, 0.6, 68, 0, 'sarcastique', 'Build in public | SaaS founder'],
    ['Nina Productivity', '@ninaprod', 'twitter', 6800, 'Productivity', 8.1, 15.2, 0.12, 0.88, 4.5, 3.9, 81, 76, 0.75, 77, 0, 'inspirant', 'Productivité & outils IA'],
    ['Thomas SEO Agent', '@thomasseo', 'twitter', 3200, 'SEO', 11.3, 22.1, 0.05, 0.94, 6.2, 5.2, 89, 92, 0.85, 85, 0, 'technique', 'SEO automation expert'],
    ['Julie NoCode', '@julienocode', 'twitter', 9400, 'NoCode', 6.7, 10.4, 0.18, 0.79, 3.5, 2.5, 74, 71, 0.65, 70, 0, 'casual', 'NoCode evangelist'],
    ['Pierre DevOps', '@pierredevops', 'twitter', 2100, 'DevOps', 13.8, 28.5, 0.03, 0.96, 7.1, 6.1, 91, 95, 0.9, 88, 0, 'technique', 'Micro-KOL DevOps automation'],
    ['Emma Growth', '@emmagrowth', 'youtube', 22000, 'Growth Hacking', 4.2, 6.3, 0.28, 0.68, 2.1, 2.2, 68, 82, 0.55, 65, 0, 'inspirant', 'Growth hacker & YouTubeuse'],
    ['Lucas AI Review', '@lucasairev', 'youtube', 7500, 'AI Tools', 8.9, 14.8, 0.11, 0.87, 4.8, 4.1, 83, 80, 0.78, 79, 0, 'informatif', 'Test & review d\'outils IA'],
    ['Camille Startup', '@camillestartup', 'twitter', 1800, 'Startup Tools', 15.2, 32.1, 0.02, 0.97, 8.3, 7.2, 93, 88, 0.92, 91, 0, 'casual', 'Micro-KOL passion startup'],
    ['David Twitch Dev', '@davidtwitchdev', 'twitch', 5400, 'Live Coding', 7.5, 11.8, 0.14, 0.83, 4.0, 3.3, 76, 74, 0.72, 73, 0, 'sarcastique', 'Live coding & tools review'],
    ['Sarah Automation', '@sarahauto', 'twitter', 11200, 'Automation', 5.8, 9.1, 0.20, 0.77, 3.6, 2.6, 73, 85, 0.62, 69, 0, 'informatif', 'Automation workflows & Zapier'],
    ['Maxime IndieHack', '@maxindie', 'twitter', 3800, 'Indie Hacking', 10.5, 19.7, 0.07, 0.92, 5.5, 4.8, 86, 83, 0.82, 82, 0, 'casual', 'Indie hacker building in public'],
    ['Claire Analytics', '@clairedata', 'twitter', 6100, 'Data Analytics', 7.3, 13.1, 0.13, 0.85, 4.3, 3.5, 79, 81, 0.73, 75, 0, 'technique', 'Data analytics pour SaaS'],
    ['Antoine API', '@antoineapi', 'twitter', 2800, 'API Tools', 12.1, 25.3, 0.04, 0.95, 6.8, 5.8, 90, 93, 0.88, 87, 0, 'technique', 'API-first enthusiast'],
  ];

  const insertKolTx = db.transaction(() => {
    for (const k of kols) {
      insertKol.run(...k);
    }
  });
  insertKolTx();

  // ----- SEGMENTS -----
  const insertSeg = db.prepare(`
    INSERT INTO segments (name, description, mindshare_need, ad_budget_level, market_size, growth_rate, example_tools, opportunity_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const segments = [
    ['Outils de Productivité IA', 'Micro-SaaS qui augmentent la productivité via l\'IA (résumé, écriture, planification)', 92, 'faible', '$2.4B', 34.5, 'Notion AI, Otter.ai, Taskade, Mem.ai', 88],
    ['Générateurs de Code', 'Outils de génération/complétion de code assistés par IA', 87, 'faible', '$1.8B', 42.1, 'Cursor, Copilot, Codeium, Tabnine', 91],
    ['Agents SEO Automatisés', 'Micro-SaaS d\'automatisation SEO avec agents IA', 95, 'très faible', '$890M', 51.3, 'Surfer, Frase, Clearscope, MarketMuse', 94],
    ['Outils NoCode/LowCode', 'Plateformes de création sans code avec couche IA', 78, 'moyen', '$3.1B', 28.7, 'Bubble, Webflow AI, Softr, Glide', 72],
    ['Analytics & Tracking SaaS', 'Micro-SaaS de suivi analytique et attribution', 85, 'faible', '$1.2B', 38.9, 'Plausible, Fathom, PostHog, Mixpanel', 83],
  ];

  const insertSegTx = db.transaction(() => {
    for (const s of segments) {
      insertSeg.run(...s);
    }
  });
  insertSegTx();

  // ----- COMPETITOR WEAKNESSES -----
  const insertWk = db.prepare(`
    INSERT INTO competitor_weaknesses (agency_type, weakness, severity, description, maas_solution, impact_area)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const weaknesses = [
    ['Agences social media classiques', 'Manque de profondeur technique', 9, 'Les agences généralistes ne comprennent pas les subtilités des produits SaaS/dev tools et produisent du contenu superficiel.', 'Équipe spécialisée SaaS avec scoring KOL technique', 'Qualité du contenu'],
    ['Agences social media classiques', 'Tarification rigide et opaque', 8, 'Forfaits mensuels fixes sans lien avec la performance réelle. Le client paie même si les résultats sont médiocres.', 'Modèle basé sur la performance avec transparence totale', 'Coût / ROI'],
    ['Agences social media classiques', 'Absence de tracking ROI précis', 9, 'Pas de suivi d\'attribution clair entre une campagne d\'influence et les inscriptions/achats réels.', 'Mindshare Index + attribution multi-touch intégrée', 'Mesure de performance'],
    ['Agences d\'influence', 'Sélection de KOLs basée sur les vanity metrics', 8, 'Choix des influenceurs uniquement sur le nombre de followers, pas sur la capacité de conversion réelle.', 'Algorithme de scoring KOL basé sur 10 variables de conversion', 'Efficacité des campagnes'],
    ['Agences d\'influence', 'Friction humaine dans l\'orchestration', 7, 'Processus manuels lents : briefing, allers-retours, validation. Délais de 2-4 semaines par campagne.', 'Content Orchestrator automatisé avec adaptation psychographique', 'Vitesse d\'exécution'],
    ['Agences marketing digital', 'Incapacité à identifier les Micro-KOLs à fort impact', 9, 'Ignorent les créateurs <10k followers qui ont un taux de conversion 3x supérieur dans les communautés dev.', 'Détection algorithmique des Micro-KOLs par engagement technique', 'Découverte de talents'],
    ['Agences marketing digital', 'Pas de personnalisation du ton par KOL', 7, 'Contenu générique envoyé à tous les KOLs sans adaptation au style personnel de chacun.', 'Profilage psychographique et adaptation automatique du ton', 'Authenticité'],
    ['Agences growth hacking', 'Absence de vision long-terme du mindshare', 8, 'Focus sur les métriques court-terme (clics, impressions) sans construire une autorité de niche durable.', 'Stratégie Mindshare avec suivi de l\'autorité de niche dans le temps', 'Stratégie long-terme'],
  ];

  const insertWkTx = db.transaction(() => {
    for (const w of weaknesses) {
      insertWk.run(...w);
    }
  });
  insertWkTx();

  // ----- CAMPAIGNS (demo) -----
  const insertCamp = db.prepare(`
    INSERT INTO campaigns (client_name, product_name, niche, status, kol_ids, hook,
      thread_content, bip_content, cta_content, short_content,
      mindshare_index, impressions, clicks, conversions, roi_percent, budget, revenue_generated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertCamp.run(
    'CodeFlow', 'CodeFlow AI', 'Code Generation', 'active',
    '1,2,5', 
    'Et si votre IDE pouvait écrire 80% de votre code boilerplate ?',
    '🧵 Thread: 5 façons dont CodeFlow AI transforme le workflow dev...\n\n1/ Le problème: 60% du temps dev est du boilerplate\n2/ CodeFlow analyse votre codebase et génère le contexte\n3/ Intégration native VS Code + JetBrains\n4/ Résultats: -45% de temps sur les PR reviews\n5/ Essayez gratuitement → lien en bio',
    '📊 Build in Public jour 47:\nNotre Mindshare Index est passé de 12 à 67 en 3 semaines.\nVoici comment on a fait...\n\n→ 5 micro-KOLs ciblés\n→ 15 threads techniques\n→ 3 newsletters sponsorisées\n\nRésultat: +340% de signups organiques',
    '🚀 Arrêtez de coder du boilerplate.\n\nCodeFlow AI génère votre code en contexte.\n\n✅ -45% temps de dev\n✅ +60% qualité PR\n✅ Gratuit pour les projets open-source\n\n→ Essayez maintenant: codeflow.ai/try',
    '⚡ 60 sec pour comprendre CodeFlow AI\n\nLe problème → La solution → La preuve\nFormat short pour YouTube/TikTok',
    73.5, 245000, 12300, 890, 312, 4500, 18540
  );

  insertCamp.run(
    'SEO Pilot', 'SEO Pilot Agent', 'SEO', 'active',
    '3,5,14',
    'Votre agent SEO personnel qui travaille 24/7 pendant que vous dormez',
    '🧵 Thread: L\'ère des agents SEO est arrivée...\n\n1/ Google change son algo 500+ fois/an\n2/ Aucun humain ne peut suivre ce rythme\n3/ SEO Pilot surveille, analyse et optimise en continu\n4/ Case study: +180% trafic organique en 60 jours\n5/ L\'agent qui remplace une équipe SEO de 3 personnes',
    '📊 Build in Public jour 23:\nOn a lancé SEO Pilot il y a 3 semaines.\n89 utilisateurs beta.\nNRR de 140%.\nLe produit se vend tout seul quand le mindshare est là.',
    '🎯 Votre site mérite la page 1.\n\nSEO Pilot = votre agent SEO IA 24/7\n\n→ Audit automatique\n→ Optimisation continue\n→ Rapports hebdo\n\nEssai gratuit 14 jours: seopilot.ai',
    '🔍 Comment SEO Pilot a boosté mon trafic de 180% - Short YouTube',
    61.2, 178000, 8900, 520, 245, 3200, 11040
  );

  // ----- MINDSHARE METRICS (30 jours de données) -----
  const insertMetric = db.prepare(`
    INSERT INTO mindshare_metrics (campaign_id, date, twitter_impressions, twitter_engagement,
      newsletter_opens, newsletter_ctr, youtube_views, twitch_viewers, brand_mentions, sentiment, mindshare_index)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const metricsTx = db.transaction(() => {
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const progress = (30 - i) / 30;

      // Campaign 1 - CodeFlow
      insertMetric.run(1, dateStr,
        Math.round(3000 + progress * 12000 + Math.random() * 2000),
        3.2 + progress * 4.8 + Math.random() * 1.5,
        Math.round(800 + progress * 2200 + Math.random() * 400),
        12.5 + progress * 15 + Math.random() * 3,
        Math.round(500 + progress * 3500 + Math.random() * 800),
        Math.round(50 + progress * 200 + Math.random() * 50),
        Math.round(5 + progress * 40 + Math.random() * 10),
        65 + progress * 20 + Math.random() * 8,
        15 + progress * 58.5 + Math.random() * 5
      );

      // Campaign 2 - SEO Pilot
      insertMetric.run(2, dateStr,
        Math.round(2000 + progress * 8000 + Math.random() * 1500),
        2.8 + progress * 4.2 + Math.random() * 1.2,
        Math.round(600 + progress * 1800 + Math.random() * 300),
        10.2 + progress * 12 + Math.random() * 2.5,
        Math.round(300 + progress * 2500 + Math.random() * 600),
        Math.round(30 + progress * 150 + Math.random() * 40),
        Math.round(3 + progress * 30 + Math.random() * 8),
        60 + progress * 18 + Math.random() * 7,
        12 + progress * 49.2 + Math.random() * 4
      );
    }
  });
  metricsTx();

  // ----- MARKET AUDIT DATA -----
  const insertAudit = db.prepare(`
    INSERT INTO market_audits (niche, opportunity_type, title, description, potential_reach, competition_level, trending_score, source)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const audits = [
    ['AI Tools', 'newsletter', 'Top 10 outils IA pour développeurs en 2026', 'Forte demande pour des comparatifs actualisés d\'outils IA dev', 45000, 'moyen', 87, 'X/Twitter trends'],
    ['AI Tools', 'thread_x', 'Comment j\'ai automatisé 80% de mon workflow avec l\'IA', 'Thread build-in-public très engageant sur l\'automatisation IA', 32000, 'faible', 92, 'X/Twitter engagement'],
    ['AI Tools', 'newsletter', 'L\'IA qui remplace les junior devs: mythe ou réalité?', 'Sujet polémique avec fort taux d\'ouverture prédit', 68000, 'élevé', 78, 'Newsletter trends'],
    ['AI Tools', 'thread_x', 'J\'ai testé 50 outils IA en 30 jours, voici mon verdict', 'Format listicle très partageable', 55000, 'moyen', 85, 'X/Twitter viral patterns'],
    ['AI Tools', 'video_short', 'Avant/Après: coder avec vs sans IA', 'Format short avec fort potentiel viral', 120000, 'faible', 95, 'YouTube Shorts trends'],
    ['AI Tools', 'newsletter', 'Le guide ultime du prompt engineering pour devs', 'Contenu éducatif evergreen à fort potentiel', 38000, 'moyen', 81, 'SEO keyword analysis'],
    ['AI Tools', 'thread_x', 'Pourquoi les agents IA vont tuer le SaaS traditionnel', 'Take controversé = engagement maximal', 72000, 'faible', 94, 'X/Twitter debates'],
    ['AI Tools', 'podcast', 'Interview: le fondateur de [SaaS] sur l\'avenir de l\'IA', 'Format long-form pour crédibilité', 15000, 'très faible', 73, 'Podcast trends'],
    ['SEO', 'thread_x', 'Google SGE va tout changer: comment s\'adapter', 'Urgence + expertise = engagement', 41000, 'élevé', 88, 'X/Twitter SEO community'],
    ['SEO', 'newsletter', 'Les 5 métriques SEO qui comptent vraiment en 2026', 'Contenu actionnable très demandé', 28000, 'moyen', 79, 'Newsletter analysis'],
    ['Productivity', 'thread_x', 'Mon stack de productivité à 0€/mois (tout gratuit)', 'Fort potentiel viral dans la communauté indie', 85000, 'faible', 91, 'X/Twitter indie hackers'],
    ['Productivity', 'video_short', 'Setup tour: mon workspace de dev productif', 'Contenu visuel très engageant', 95000, 'moyen', 86, 'YouTube trends'],
  ];

  const insertAuditTx = db.transaction(() => {
    for (const a of audits) {
      insertAudit.run(...a);
    }
  });
  insertAuditTx();

  console.log('[MaaS] Base de données initialisée avec les données de démo');
}

module.exports = { initDB };
