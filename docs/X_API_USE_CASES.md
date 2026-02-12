# Cas d'utilisation des données et de l'API X — MaaS

**Document destiné à la soumission auprès de X (Twitter) pour la protection des données**

Conformément à l'[X Developer Agreement](https://docs.x.com/developer-terms/agreement) et à la [Developer Policy](https://docs.x.com/developer-terms/policy). Service commercial — tier Pro ou Enterprise.

## 1. Description du service MaaS

Mindshare-as-a-Service (MaaS) est une plateforme d'agence de marketing d'influence spécialisée dans l'écosystème SaaS et Micro-SaaS. Nous aidons les fondateurs de logiciels à accroître leur visibilité ("mindshare") auprès des développeurs et early adopters via des campagnes de contenu distribuées par des Key Opinion Leaders (KOLs) sur X, YouTube et Twitch.

**Clarification "Pay to engage"** : MaaS rémunère les KOLs pour la création et la distribution de contenu original (prestation), pas pour des actions d'engagement (likes, reposts, follows). Aucun achat ni vente d'engagement artificiel.

## 2. Cas d'utilisation des données X

### 2.1 Analyse de la performance des contenus

- **Objectif** : Mesurer l'impact des posts publiés par les KOLs partenaires sur les campagnes de nos clients.
- **Données utilisées** : Impressions (`impression_count`), engagements (likes, reposts, replies, bookmarks), métriques organiques.
- **Endpoints** : `GET /2/tweets` avec `tweet.fields=organic_metrics,public_metrics` ; `GET /2/users/:id/tweets` pour les timelines.
- **Justification** : Nos clients paient pour des campagnes et doivent voir des métriques transparentes (vues, likes, engagement) pour évaluer le ROI. Nous ne conservons que les métriques agrégées et anonymisées par campagne, pas le contenu des tweets.

### 2.2 Scoring et qualification des KOLs

- **Objectif** : Identifier les créateurs dont les posts génèrent le plus d'impressions et d'engagement relatif (taux d'engagement) dans les niches SaaS/dev.
- **Données utilisées** : Métriques publiques (impressions si disponibles via OAuth du KOL), `public_metrics` (like_count, reply_count, retweet_count, quote_count, impression_count).
- **Endpoints** : `GET /2/tweets`, `GET /2/users/:id`.
- **Justification** : Nous évaluons la capacité de portée des KOLs pour matcher nos clients avec les bons influenceurs. Les données sont utilisées pour calculer un score de compatibilité ; nous ne revendons pas ces données.

### 2.3 Agrégation dans le Mindshare Index

- **Objectif** : Produire un indicateur unique (0-100) agrégé : impressions X, taux d'ouverture newsletter, vues YouTube, etc.
- **Données utilisées** : `impression_count`, `like_count`, `retweet_count`, `reply_count` agrégés par campagne et par période.
- **Stockage** : Valeurs numériques agrégées uniquement (ex. : 45 000 impressions, 3,2 % engagement), jamais le contenu des tweets.
- **Justification** : Fournir au client une vue unifiée de sa visibilité sans exposer de données personnelles ou de contenu.

### 2.4 Estimation de la valeur publicitaire équivalente

- **Objectif** : Estimer la "valeur équivalente" d'un post organique en se basant sur le CPM publicitaire X (coût pour 1000 impressions en publicité).
- **Données utilisées** : `impression_count` pour calculer : (impressions / 1000) × CPM_estimé.
- **Justification** : Aider le client à visualiser la valeur de la portée obtenue via l'influence par rapport à une campagne payante. Aucune donnée personnelle n'est utilisée.

## 3. Données que nous ne collectons pas

- Contenu des tweets (texte, médias)
- Données de profil détaillées des followers
- Données de localisation ou démographiques des utilisateurs
- Données de messagerie ou DM

## 4. Conservation et sécurité

- **Durée de conservation** : Les métriques agrégées sont conservées 24 mois pour les rapports clients, puis supprimées.
- **Accès** : Uniquement les employés MaaS autorisés et le client propriétaire de la campagne.
- **Sécurité** : Chiffrement en transit (HTTPS) et au repos ; pas de partage avec des tiers à des fins publicitaires ou de ciblage.

## 5. Conformité RGPD

- Base légale : exécution du contrat (prestation de service au client).
- Droits des personnes : les KOLs et utilisateurs X peuvent exercer leurs droits auprès de X ; nous ne détenons pas de données personnelles identifiables issues de l'API.
- Sous-traitance : utilisation de l'API X conformément aux Conditions d'utilisation et Politique de confidentialité de X.
