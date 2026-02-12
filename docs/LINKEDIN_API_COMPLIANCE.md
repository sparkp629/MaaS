# Conformité API LinkedIn pour MaaS

## Source
- [LinkedIn Product Catalog](https://developer.linkedin.com/product-catalog)
- Documentation officielle LinkedIn Developers

---

## Produits LinkedIn pertinents pour MaaS

### 1. Marketing Tools — Community Management
- **Usage MaaS** : Établir une présence de marque, gérer une communauté sur LinkedIn
- **Capacités** : Gestion des Pages LinkedIn, publications, analytics de Page
- **Pertinence** : ⭐⭐⭐ Pour les campagnes B2B sur LinkedIn (Pages entreprise)
- **Restriction** : Accès principalement pour les **Pages LinkedIn** (entreprises), pas pour les profils personnels en lecture analytics tierce

### 2. Consumer — Share on LinkedIn
- **Usage MaaS** : Permettre aux utilisateurs de partager du contenu vers leur profil LinkedIn
- **Capacités** : Bouton "Share on LinkedIn", intégration UGC
- **Pertinence** : ⭐⭐ Utile pour des CTA "Partager sur LinkedIn" depuis le dashboard MaaS
- **Restriction** : L'utilisateur partage volontairement ; MaaS ne poste pas à sa place

### 3. Marketing Tools — Data Integrations
- **Usage MaaS** : Connecter les données entre plateformes (ex. CRM, analytics)
- **Capacités** : Sync données Marketing/Ads
- **Pertinence** : ⭐ Pour attribution si campagnes LinkedIn Ads utilisées en parallèle

### 4. Marketing Tools — Advertising
- **Usage MaaS** : Scale et optimisation des publicités LinkedIn
- **Capacités** : Campaign Management API, reporting
- **Pertinence** : ⭐⭐ Si MaaS gère aussi des campagnes payantes LinkedIn Ads

### 5. Sales — Sales Display
- **Usage MaaS** : Afficher profils et comptes, envoyer des messages aux leads
- **Capacités** : Accès profil LinkedIn (Sales Navigator)
- **Pertinence** : ⚠️ **Non applicable** — MaaS cible le Mindshare via KOLs, pas le Sales Navigator

### 6. Regulatory — Member Data Portability / Pages Data Portability
- **Usage MaaS** : Accès aux données membre ou Pages sur demande (RGPD / portabilité)
- **Pertinence** : ⭐ Pour conformité RGPD si un client demande l’export de ses données

---

## Ce que MaaS a besoin vs ce que LinkedIn autorise

| Besoin MaaS | Produit LinkedIn | Autorisé ? |
|-------------|------------------|------------|
| Impressions, engagement KOL (profils perso) | — | ❌ Pas d’API publique pour analytics de profils personnels |
| Posting automatisé au nom de KOLs | Share on LinkedIn / Community Mgmt | ⚠️ KOL doit autoriser ; pas de bulk posting automatisé |
| Données de Page LinkedIn (entreprise) | Community Management | ✅ Oui, pour Pages dont MaaS a l’accès |
| Profils publics (nom, titre, followers) | Sign in with LinkedIn, certains endpoints | ⚠️ Données limitées, pas d’analytics détaillés |
| Identifier les KOLs LinkedIn | — | ❌ Pas d’API de découverte d’influenceurs |

---

## Conclusion pour MaaS

### ✅ Utilisations conformes
1. **Share on LinkedIn** : Bouton pour que le client ou le KOL partage du contenu généré par MaaS
2. **Community Management** : Analytics des **Pages LinkedIn** du client (si MaaS gère ces Pages)
3. **Sign in with LinkedIn** : Connexion avec LinkedIn (optionnel)
4. **Data Portability** : Exporter les données si demandé par le client (RGPD)

### ❌ Non disponible via API
- **Impressions / engagement des profils personnels** (KOLs) : LinkedIn ne fournit pas d’API pour les métriques des comptes personnels. Les données LinkedIn dans le Mindshare Index sont basées sur :
  - Données fournies manuellement par le KOL
  - Estimation / proxy (ex. abonnés, activité visible)
  - Ou intégration avec un partenaire agréé LinkedIn (Community Management pour Pages uniquement)

### Stratégie recommandée
1. **Mindshare Index LinkedIn** : Conserver une source "LinkedIn" basée sur des données déclaratives ou estimées, en indiquant clairement dans l’UI : *« Données LinkedIn : déclaratives ou estimées — pas d’API analytics disponible pour les profils personnels »*
2. **Pages entreprise** : Si le client a une Page LinkedIn, utiliser Community Management pour les analytics de Page.
3. **Partage** : Utiliser le bouton Share on LinkedIn pour amplifier les contenus générés.
4. **Éviter** : Scraping, utilisation non autorisée des données, auto-posting massif sans consentement explicite.

---

## Références
- [LinkedIn API Products](https://developer.linkedin.com/product-catalog)
- [Share on LinkedIn](https://developer.linkedin.com/docs/share-on-linkedin)
- [Community Management](https://developer.linkedin.com/docs/community-management) (nécessite partenariat / accès spécifique)
- [API Terms of Use](https://developer.linkedin.com/legal/api-terms-of-use)
