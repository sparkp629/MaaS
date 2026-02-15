# Prompt détaillé : affichage des données du dashboard et lien backend

Ce document sert de référence pour les prochaines modifications du dashboard (blocs visuels, placement, forme des données) et de la corrélation avec le backend (mock, APIs).

---

## 1. Contexte et critiques objectives (à ne pas paraphraser)

- Certains éléments d’affichage ont été jugés **trop abstraits** et **trop approximatifs**.
- Une première modification avait visé un rendu « intuitif et en couleurs, comme les autres outils d’analyse de données » (affiches, tableaux, graphiques) ; **ce choix a été considéré comme une erreur grave** : le résultat n’a pas séduit.
- **Consigne actuelle** : l’affichage des données doit être **intuitif**, mais **ne doit pas ressembler** à des cartes, tableaux ou graphiques classiques. Le chef de projet n’a pas d’idée créative précise à imposer ; il faut proposer un autre type de rendu, distinct des outils d’analyse habituels.

---

## 2. État actuel du dashboard (dernier commit) — à respecter ou à faire évoluer

### Emplacements et blocs à garder ou à déplacer

- **En-tête** : titre « Dashboard » + sélecteur de période (24h, Weekly, Monthly, Annually). **À garder** en haut.
- **Ligne de métriques globales** : KOLs Tracked, jauge Mindshare (Eng. 7d / 30d / 1y), Clicks, Impressions. **Emplacement** : à conserver en haut ; les **formes** (cartes, jauge circulaire) peuvent être revues pour être moins « type tableau / graphique » et plus intuitives.
- **Filtre par réseau** : All + icônes (Twitter, YouTube, LinkedIn, Newsletter, TikTok, Instagram). **À garder** ; tailles et placement déjà définis (ex. icônes w-9 h-9).
- **KOL Discovery** : liste de cartes KOL (avatar, handle, niche, métriques : Followers, Mindshare, Conv. Score, Eng. Rate) + zone de prévisualisation réseau (Twitter, YouTube, LinkedIn). **Emplacement** : peut rester ; **forme** des cartes et de l’affichage des métriques à revoir pour plus d’intuitivité et moins de « carte / tableau ».
- **Bouton « Show more »** : affiche les KOL suivants (au-delà du top 5). **À garder**.
- **Bouton AI Content** : un seul bouton sous le contenu KOL (pas de carte contextuelle). **À garder** ; état « Coming soon » / désactivé jusqu’à implémentation.
- **Market Intelligence & ROI** :
  - Métriques : Clicks, Impressions, Mindshare Growth, Spend (chiffres + tendances en flèches, **pas** de barres de progression en %).
  - Blocs « High-demand segments » et « Competitor weaknesses » (listes / données). **Emplacements** : certains peuvent rester, d’autres changer de place selon la nouvelle maquette ; les **formes** d’affichage doivent devenir plus intuitives et ne pas ressembler à des tableaux ou graphiques classiques.

### Éléments explicitement à ne pas reproduire

- **Ne pas** calquer le style des « autres outils d’analyse de données » (affiches, tableaux, graphiques type analytics).
- **Ne pas** se contenter de cartes, tableaux ou graphiques classiques pour les données ; chercher des formes d’affichage différentes tout en restant **intuitives**.

---

## 3. Corrélation backend (mock, bouton, APIs)

- **Données actuelles** : le frontend appelle les routes API (dashboard, KOLs, intelligence, ROI). Si les clés API ne sont pas configurées, le backend peut renvoyer des **samples / mock** ou des erreurs. Pour avancer sur les **blocs visuels** sans APIs réelles :
  - Soit le front n’affiche **aucune donnée** (placeholders « Aucune donnée ») dans les blocs.
  - Soit le backend renvoie systématiquement du **mock** propre (pas d’erreur affichée) pour que les blocs restent remplis en dev.
- **Bouton « mock »** (ou équivalent) : s’il existe dans l’interface ou le flux, il doit rester cohérent avec cette logique (basculer entre données vides et données de démo, sans casser l’affichage des blocs).
- **Objectif** : les blocs et leur **design** (formes, placement, lisibilité) peuvent être finalisés même sans APIs réelles ; le jour où les données sont branchées (Supabase, APIs externes), seuls le **contenu** des blocs change, pas leur structure visuelle décrite ici.

---

## 4. Rappel onboarding → dashboard

- Les **réponses au sondage (onboarding)** alimentent les **données du dashboard** (filtres, recommandations, personnalisation). L’UI du dashboard reste la même ; seuls les contenus des blocs évoluent avec ces données (et plus tard les APIs).
- **À rappeler au moment opportun** : lors de l’implémentation du stockage des réponses (ex. localStorage → Supabase) et du branchement de ces réponses dans le dashboard, se référer à ce paragraphe et au fichier `docs/ONBOARDING_TO_DASHBOARD_REMINDER.md`.
