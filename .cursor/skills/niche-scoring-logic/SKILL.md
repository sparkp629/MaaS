---
name: niche-scoring-logic
description: Expert Data Science pour implémenter scores composites type "Mindshare Index" sans bibliothèques lourdes. Utilise uniquement des algorithmes de pondération et normalisation en pur JS/TS. Use when designing niche scoring, composite indices, weighting schemes, or mindshare-like KPIs.
---

# Niche Scoring Logic

Expert en Data Science pour scores composites (Mindshare Index et dérivés) — sans pandas, scikit-learn ni numpy. Uniquement formules et algorithmes de pondération en pur JavaScript/TypeScript.

## Périmètre

- **Inclus** : Mindshare Index, scores composites, pondérations, normalisation (0–100), paliers
- **Exclu** : Ingestion données, génération contenu, UI des graphiques

---

## Exemples de prompts (quand m'invoquer)

- « Revoir les pondérations du Mindshare Index »
- « Ajouter une dimension TikTok au score »
- « Changer l'algorithme de normalisation des impressions »
- « Définir les paliers poor/good/excellent pour newsletter »
- « Implémenter un score composite sans pandas »

---

## Quand ne pas m'invoquer

- Récupération métriques X/newsletters → `agent-scraper`
- Hook → contenu → `content-orchestrator`
- Affichage gauge, graphiques → `agent-frontend`
- Auth, Stripe → `core-infra`

---

## 1. Principes de base

### Contrainte : zéro dépendance lourde

- **Interdit** : pandas, scikit-learn, numpy, statsmodels
- **Autorisé** : `Math.*`, boucles, réduction, tableaux natifs
- **Objectif** : code lisible, performant, facile à auditer

### Structure d'un score composite

```
Score = Σ (score_normalisé_i × poids_i)
       où Σ poids_i = 1
```

---

## 2. Algorithmes de normalisation

### 2.1 Paliers (benchmarks) — recommandé par défaut

Transforme une valeur brute en score 0–100 via paliers poor / good / excellent. Idéal pour des métriques à plafond connu.

```js
function normalizeBenchmark(value, poor, good, excellent) {
  if (value <= poor) return Math.max(0, (value / poor) * 30);
  if (value <= good) return 30 + ((value - poor) / (good - poor)) * 40;
  if (value <= excellent)
    return 70 + ((value - good) / (excellent - good)) * 30;
  return Math.min(100, 100 + ((value - excellent) / excellent) * 10); // cap raisonnable
}
```

**Avantages** : interprétable, pas de dérive avec les valeurs extrêmes.  
**Inconvénients** : seuils à définir par métrique.

### 2.2 Min-Max sur une fenêtre

Pour des séries temporelles ou des comparaisons relatives.

```js
function normalizeMinMax(value, min, max) {
  const range = max - min || 1;
  return Math.max(0, Math.min(100, ((value - min) / range) * 100));
}
```

À utiliser avec des bornes historiques ou par segment (ex. quartile 0–1).

### 2.3 Log-scale (réduction des valeurs extrêmes)

Réduit l’impact des outliers sans clipping brutal.

```js
function normalizeLog(value, maxExpected) {
  const safe = Math.max(1, value);
  const logMax = Math.log(1 + maxExpected);
  return Math.min(100, (Math.log(1 + safe) / logMax) * 100);
}
```

Utile pour impressions, vues, clics.

### 2.4 Proportion (pour des ratios)

Pourcentage ou ratio déjà borné 0–100 → simple scale linéaire.

```js
function normalizePercent(value, excellentAt = 100) {
  return Math.min(100, (value / excellentAt) * 100);
}
```

---

## 3. Pondération

### 3.1 Pondération fixe (sum = 1)

```js
const WEIGHTS = {
  channel_a: 0.25,
  channel_b: 0.2,
  channel_c: 0.15,
  channel_d: 0.1,
  channel_e: 0.05,
  mentions: 0.12,
  sentiment: 0.13,
};
// Vérifier: Object.values(WEIGHTS).reduce((a,b)=>a+b, 0) === 1
```

### 3.2 Sous-composantes (micro-pondération)

Pour une dimension avec plusieurs métriques (ex. Twitter = impressions + engagement) :

```js
const twitter_score = impScore * 0.4 + engScore * 0.6; // engagement prioritaire
```

### 3.3 Pondération adaptative (sans ML)

Ajuster le poids selon la qualité du signal (ex. peu de données → réduire le poids).

```js
function adaptiveWeight(rawWeight, dataQuality) {
  // dataQuality 0-1 : fiabilité du canal (ex. couverture, fraîcheur)
  return rawWeight * (0.3 + 0.7 * dataQuality);
}
```

---

## 4. Niveaux / seuils (qualitatifs)

Mapping score → label pour UX (ex. Mindshare : Invisible → Dominant).

```js
function levelFromScore(score) {
  if (score >= 80) return "Dominant";
  if (score >= 60) return "Fort";
  if (score >= 40) return "Croissant";
  if (score >= 20) return "Émergent";
  return "Invisible";
}
```

---

## 5. Vérifications avant implémentation

- [ ] Poids somment à 1 (arrondi acceptable : 0.999–1.001)
- [ ] Chaque dimension est normalisée 0–100 avant pondération
- [ ] Gestion des métriques manquantes (0, moyenne, ou exclusion)
- [ ] Pas de division par zéro (max/min/range protégés)
- [ ] Résultat final capé 0–100 (ou cohérent avec le design)

---

## 6. Pattern recommandé pour un nouveau score

1. **Définir les dimensions** et leurs métriques brutes
2. **Choisir la normalisation** par dimension (benchmark vs log vs min-max)
3. **Fixer les poids** (expertise métier ou AHP simplifié)
4. **Implémenter** : `Σ normalize(dim_i) × weight_i`
5. **Exposer le breakdown** pour débogage et transparence

---

## 7. Référence Mindshare Index (MaaS)

Structure actuelle pour inspiration :

| Dimension  | Poids | Sous-métriques                       | Normalisation |
| ---------- | ----- | ------------------------------------ | ------------- |
| Twitter    | 25%   | impressions (40%) + engagement (60%) | benchmarks    |
| Newsletter | 20%   | opens (40%) + ctr (60%)              | benchmarks    |
| YouTube    | 15%   | vues                                 | benchmarks    |
| LinkedIn   | 10%   | impressions (50%) + engagement (50%) | benchmarks    |
| Twitch     | 5%    | viewers                              | benchmarks    |
| Mentions   | 12%   | count                                | benchmarks    |
| Sentiment  | 13%   | score 0–100                          | benchmarks    |

---

## Ressources additionnelles

Pour des variantes (scores par segment, évolution temporelle, agrégation multi-campagnes), définir d’abord le schéma des données et la règle métier souhaitée avant de coder.
