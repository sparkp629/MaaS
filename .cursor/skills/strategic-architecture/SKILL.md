---
name: strategic-architecture
description: Models SaaS/MaaS business architectures and compares cost structures between human-operated and automated infrastructure. Use when discussing SaaS or MaaS monetization, unit economics, TCO, break-even analysis, or human vs. automation cost tradeoffs.
---

# Strategic Architecture

Expertise en modélisation des modèles d'affaires SaaS/MaaS et en comparaison des structures de coûts (humain vs. automatisé).

## Périmètre

- **Inclus** : Modèles d'affaires SaaS/MaaS, TCO, break-even, comparaison humain vs automatisé
- **Exclu** : Implémentation code, choix techniques stack, ingestion données

---

## Exemples de prompts (quand m'invoquer)

- « Comparer le coût humain vs automatisé pour 1000 KOLs »
- « Quel seuil de rentabilité pour un MaaS à 49€/mois ? »
- « Modéliser un modèle freemium pour MaaS »
- « TCO d'une équipe 3 personnes vs tout automatisé »

---

## Quand ne pas m'invoquer

- Codage, intégration API → compétence par défaut ou skills dédiés
- Calcul Mindshare, pondérations → `niche-scoring-logic`
- Flux paiement x402, A2A → `agentic-governance`

---

## 1. Modélisation SaaS / MaaS

### Typologie des modèles de revenus

| Modèle          | Structure                                               | Exemple                      |
| --------------- | ------------------------------------------------------- | ---------------------------- |
| **Abonnement**  | Revenu récurrent fixe (mensuel/annuel)                  | Flat fee par mois            |
| **Usage-based** | Facturation à la consommation (API calls, transactions) | Coût par requête             |
| **Freemium**    | Gratuit + upsell fonctionnalités premium                | Seuil limité gratuit         |
| **Hybride**     | Base + overages                                         | Base + dépassement par unité |

### Métriques clés

- **MRR/ARR** : Revenus récurrents mensuels/annuels
- **LTV** : Customer Lifetime Value (revenu moyen par client sur la durée)
- **CAC** : Coût d'acquisition client
- **Churn** : Taux de résiliation (mensuel/annuel)
- **Net Revenue Retention** : Croissance des revenus sur client existant
- **Gross Margin** : Marge brute (revenus − coûts directs)

### Formules usuelles

```
LTV ≈ ARPU / Churn
LTV/CAC > 3 (souhaité)
Payback CAC < 12 mois
```

---

## 2. Comparaison des structures de coûts (humain vs. automatisé)

### Catégories à comparer

| Catégorie           | Humain                                           | Automatisé                                 |
| ------------------- | ------------------------------------------------ | ------------------------------------------ |
| **Personnel**       | Salaires, charges, formations, turn-over         | Coût de développement/maintenance logiciel |
| **Opérations**      | Temps de traitement, erreurs manuelles, horaires | Compute, API, stockage, monitoring         |
| **Scalabilité**     | Recrutement, onboarding, plafond opérationnel    | Scaling horizontal (cloud)                 |
| **Qualité**         | Variabilité, fatigue, formation continue         | Reproductibilité, tests automatisés        |
| **Coûts fixes**     | Effectif minimum même à faible volume            | Infra de base (serveurs, licences)         |
| **Coûts variables** | Heures supplémentaires, CDD/intérim              | Coût proportionnel au volume traité        |

### Framework de comparaison

1. **Inventorier** : Lister chaque poste de coût (humain et auto)
2. **Quantifier** : Coûts annuels par scénario de volume (faible, moyen, fort)
3. **Identifier le seuil** : Volume où l’automatisation devient moins chère
4. **Valoriser l’intangible** : Qualité, délai de réponse, disponibilité 24/7

### Modèle TCO simplifié

```
TCO humain = (Coût horaire × Heures/an) + Formation + Turn-over + Management
TCO automatisé = Développement initial + Infra + Maintenance + Monitoring

Break-even : Volume × Coût unitaire auto < Volume × Coût unitaire humain
```

### Points d’attention

- **Coûts cachés** : Support, incidents, escalade, documentation
- **Évolution des volumes** : Croissance prévue → avantage à l’automatisation
- **Délai de mise en place** : Automatisation = investissement initial, ROI différé

---

## 3. Format de sortie recommandé

Pour une analyse stratégique, structurer la réponse ainsi :

```markdown
## Synthèse

[1-2 phrases]

## Modèle de revenus

[Typologie, hypothèses, métriques clés]

## Comparaison des coûts

| Scénario | Humain | Automatisé | Différence |
| -------- | ------ | ---------- | ---------- |
| ...      | ...    | ...        | ...        |

## Seuil de rentabilité

[Volume ou conditions du break-even]

## Recommandation

[Contexte, incertitudes, pistes de décision]
```

---

## Ressources additionnelles

Pour des exemples de grilles ou de calculs détaillés, demander à l’utilisateur des chiffres (volumes, coûts horaires, prix cibles) afin d’alimenter une analyse chiffrée.
