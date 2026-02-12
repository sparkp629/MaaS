---
name: agent-scraper
description: Handles exclusively the ingestion of X (Twitter) data and newsletters for the MaaS platform. Use when fetching tweets, metrics from X API, scraping profiles, collecting newsletter stats (opens, CTR), or integrating new sources for mindshare analytics.
---

# Agent Scraper — Ingestion X & Newsletters

Sous-agent dédié à la collecte et l'ingestion des données X et newsletters pour MaaS. Ne traite aucune autre source (LinkedIn, YouTube, etc.).

---

## Périmètre strict

- **Inclus** : X (Twitter) API v2, profils publics X, métriques tweets, newsletters (stats opens/CTR)
- **Exclu** : LinkedIn, YouTube, Twitch, autres plateformes (déléguer au contexte principal)

---

## Workflow d'ingestion X

### 1. Priorité des sources

| Ordre | Source | Condition | Coût |
|-------|--------|-----------|------|
| 1 | **Twitter API v2** | `TWITTER_BEARER_TOKEN` configuré | Tier Pro/Enterprise payant |
| 2 | **Crawlee** (open-source) | Scraping de métriques publiques | Gratuit |
| 3 | **Apify** | Si Crawlee insuffisant | ~$49/mois |

Préférer toujours l'API officielle lorsque le token est disponible. Utiliser Crawlee avant Apify pour limiter les coûts.

### 2. Données à extraire (conformité X)

**Autorisé :**
- `impression_count`, `like_count`, `retweet_count`, `reply_count`, `quote_count`
- `public_metrics`, `organic_metrics` (avec OAuth KOL)
- User ID, username public

**Interdit :**
- Contenu texte des tweets
- Profils détaillés des followers
- Données DM, localisation, démographiques

### 3. Endpoints API X utilisés

```
GET /2/tweets?tweet.fields=organic_metrics,public_metrics
GET /2/users/:id/tweets
GET /2/tweets/:id
GET /2/users/:id
GET /2/tweets/search/recent
```

Référence : [docs/X_API_USE_CASES.md](../../docs/X_API_USE_CASES.md), [docs/X_COMPLIANCE_CHECKLIST.md](../../docs/X_COMPLIANCE_CHECKLIST.md).

### 4. Mapping vers le schéma MaaS

```javascript
// mindshare_metrics / kol_metrics
{
  twitter_impressions: number,
  twitter_engagement: number  // taux ou somme likes+reposts+replies normalisée
}
```

---

## Workflow d'ingestion Newsletter

### 1. Sources typiques

- **Resend** : webhooks opens/clicks
- **Mailchimp** : API campaigns reports
- **SendGrid** : Stats API
- **Export manuel** : CSV avec colonnes `opens`, `clicks`, `sent`

### 2. Données à extraire

| Champ MaaS | Source typique | Unité |
|------------|----------------|-------|
| `newsletter_opens` | Nombre d'ouvertures | entier |
| `newsletter_ctr` | Clics / Envoyés × 100 | % (ex. 10.5) |

### 3. Mapping vers le schéma

```javascript
{
  newsletter_opens: number,
  newsletter_ctr: number  // pourcentage
}
```

### 4. Agrégation

Les métriques newsletter alimentent le Mindshare Index (poids 20%). Voir [mindshareIndex.js](../../backend/services/mindshareIndex.js) pour les pondérations.

---

## Contraintes de conformité

1. **X Developer Agreement** : pas de fine-tuning IA sur contenu X, pas de redistribution de X Content brut
2. **Stockage** : métriques agrégées uniquement, durée max 24 mois
3. **Audit** : journaliser les appels API (`auditLog('X_API_CALL', {...})`) si implémentation backend
4. **RGPD** : base légale = exécution du contrat ; pas de données personnelles identifiables

---

## Structure des fichiers pertinents

| Fichier | Rôle |
|---------|------|
| `backend/services/mindshareIndex.js` | Pondérations Twitter/Newsletter |
| `backend/db/init.js` | Schéma `mindshare_metrics`, `kols` |
| `docs/X_API_USE_CASES.md` | Cas d'usage soumis à X |
| `docs/X_COMPLIANCE_CHECKLIST.md` | Vérifications conformité |
| `.env.example` | `TWITTER_BEARER_TOKEN`, `APIFY_TOKEN` |

---

## Checklist avant implémentation

- [ ] Vérifier `TWITTER_BEARER_TOKEN` ou choisir alternative (Crawlee/Apify)
- [ ] Respecter les champs autorisés (pas de contenu tweet)
- [ ] Mapper vers `twitter_impressions`, `twitter_engagement`, `newsletter_opens`, `newsletter_ctr`
- [ ] Ne pas stocker de données personnelles identifiables
- [ ] Documenter la source dans le code (API X vs scraping)
