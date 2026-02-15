# Sondages MaaS — Sondage unique condensé

Un seul sondage est utilisé en onboarding : **7 questions en 4 étapes**. Toutes les questions sont **les plus directes possibles** (ex. « Niche : », « Product or project name : »). Il fusionne les questions les plus pertinentes des trois modèles initiaux.

---

## Sondage unique (implémenté dans `Onboarding.jsx`)

| Étape | # | Question | Type | Objectif |
|-------|---|----------|------|----------|
| 1 | 1 | **Niche** | Fermée (choix unique) | Aligner avec les KOLs disponibles |
| 1 | 2 | **Product or project name** | Ouverte | Identifier le produit |
| 2 | 3 | **Your biggest difficulty right now?** (Lack of visibility / Not sure what content to post / Not sure which KOLs to contact / Measuring campaign ROI / Other) | Fermée | Faire percevoir au prospect qu’on connaît ses problèmes (visibilité, contenu, KOL, ROI) |
| 2 | 4 | **Biggest blockage to measure campaign ROI?** (Vanity metrics only / No conversion tracking / Lack of KOL transparency / Other) | Fermée | Cadrer la promesse (suivi ROI) |
| 3 | 5 | **Priority channel for your next campaign?** (X, LinkedIn, YouTube, Newsletter, No preference) | Fermée | Préparer le matching et l’orchestration |
| 3 | 6 | **Main goal of your next campaign (one sentence)** | Ouverte | Adapter le contenu et les KOLs |
| 4 | 7 | **Would you like a personalized proposal (audit + first campaign)?** (Yes / No / Later) | Fermée | Qualifier l’intention d’achat |

---

## Ce qui a été écarté ou reporté

- **Sondage 1** : les 3 premières questions (nom produit long, niche en phrase, nombre de campagnes) étaient jugées peu directes ; remplacées par Niche + Product name en style direct.
- **Sondage 2** : la question 1 (« Votre produit ou service en une phrase ») écartée ; les Q2–6 sont reflétées dans le condensé (budget, métriques, KOLs, format, attente peuvent être réintroduites plus tard si besoin). La **Q7** (« Un détail supplémentaire qui nous aiderait à affiner… ») : l’idée de l’ouvrir dans une **popup au mouvement du curseur vers le haut** a été jugée incertaine (on ne connaît pas l’intention de l’internaute). Elle peut être ajoutée plus tard comme **champ optionnel** en fin de sondage, sans popup.
- **Sondage 3** : aucune question reprise dans le condensé.

---

## Bénéfice KOL et part des gains

Pour la proposition de valeur envers les influenceurs (gains, part de revenus, illustration des parts entre MaaS et KOL), voir **`docs/DEALS_KOL_PROPOSITION_MAAS.md`**.

---

## Intégration

- **Login-first (actuel)** : le sondage s’affiche après le clic sur le CTA de la landing, avant l’accès au dashboard. Les réponses alimentent les données du dashboard (voir `docs/ONBOARDING_TO_DASHBOARD_REMINDER.md`).
