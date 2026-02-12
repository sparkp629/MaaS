# Checklist conformité X Developer — MaaS

Document de vérification pour s'assurer que MaaS respecte l'[X Developer Agreement](https://docs.x.com/developer-terms/agreement) et la [Developer Policy](https://docs.x.com/developer-terms/policy) malgré son caractère lucratif.

---

## Récapitulatif des règles clés (X)

| Règle | MaaS conforme ? | Détail |
|-------|-----------------|--------|
| **Pay to engage** | ✅ Oui | MaaS rémunère les KOLs pour la **création de contenu**, pas pour des likes/reposts. Pas d'achat d'engagement artificiel. |
| **Benchmarking global X** | ✅ Oui | On ne calcule pas de métriques plateforme globales (MAs, DAs, etc.). Métriques **par campagne** uniquement. |
| **Pas d'iframe X Content** | ✅ Oui | Affichage de **métriques agrégées uniquement** (chiffres). Aucun embed de Posts/Tweets. |

---

## ✅ Restrictions d'utilisation (Agreement III)

| Règle | Statut MaaS | Justification |
|-------|-------------|---------------|
| Pas de reverse engineering / décompilation | ✅ | Utilisation standard de l'API documentée |
| Pas de création de substitut à X | ✅ | MaaS complète X (analytics, matching KOLs), ne le remplace pas |
| Pas de vente/redistribution du Licensed Material | ✅ | Pas de revente d'accès API ou de données brutes |
| Pas d'information non publique sur utilisateurs X | ✅ | Utilisation uniquement de `public_metrics` et `organic_metrics` (avec OAuth KOL) |
| **Pas de fine-tuning / entraînement de modèles** | ✅ | Pas d'IA entraînée sur du contenu X |
| **Pas de ciblage pub hors X** | ✅ | On n'utilise pas X Content pour cibler des pubs ailleurs |
| Pas d'iframe de X Content | ✅ | Affichage de métriques agrégées, pas d'embed de Posts |
| Secrets API gardés privés | ✅ | Tokens dans .env, jamais exposés |

---

## ✅ Usage commercial (Agreement III.B, Policy)

| Règle | Statut MaaS | Action requise |
|-------|-------------|----------------|
| Tiers appropriés (Basic/Pro/Enterprise) | ⚠️ | **Souscrire Pro ou Enterprise** — MaaS est commercial, pas Free |
| Description de cas d'usage validée par X | ✅ | `X_API_USE_CASES.md` soumis lors de la demande |
| Pas de white-label multi-apps sans accord | ✅ | Une seule app MaaS |

---

## ✅ Pay to engage (Policy — "Pay to engage")

| Règle | Statut MaaS | Clarification |
|-------|-------------|---------------|
| "Ne pas compenser les gens pour des *actions* sur X" | ✅ | MaaS rémunère les KOLs pour la **création de contenu** (prestation), pas pour des likes/reposts/clics. Les KOLs publient du contenu original dans le cadre d'un contrat d'influence — différent du "pay for engagement" prohibé. |
| Pas de vente/achat de likes, follows, etc. | ✅ | Aucun achat d'engagement artificiel |

---

## ✅ Pas de monitoring / benchmarking X (Agreement III.C, Policy)

| Règle | Statut MaaS | Clarification |
|-------|-------------|---------------|
| Pas de calcul d'agrégats X (MAs, DAs, posts/jour) | ✅ | On ne calcule pas de métriques plateforme globales |
| Pas de mesure de réactivité de X | ✅ | Non utilisé |
| Métriques *par campagne* / *par tweet* | ✅ | **Autorisé** — impressions, likes, etc. par contenu/campagne, pas agrégats plateforme |

---

## ✅ Redistribution de contenu (Policy)

| Règle | Statut MaaS | Clarification |
|-------|-------------|---------------|
| Pas de redistribution de X Content brut | ✅ | On ne redistribue pas de Posts (texte/médias) |
| Distribution limitée (Post IDs, User IDs) | ✅ | On n'expose pas de listes d'IDs à des tiers |
| Affichage à nos clients | ✅ | Métriques agrégées uniquement (chiffres), pas de contenu |

---

## ✅ Vie privée et consentement (Policy)

| Règle | Statut MaaS | Action requise |
|-------|-------------|----------------|
| Politique de confidentialité affichée | ⚠️ | **Avoir une page Privacy Policy** avant inscription |
| Consentement explicite avant actions au nom de l'utilisateur | ✅ | Connexion GitHub + charte ; pas de post automatique sans accord |
| Pas de stockage de DM / contenu privé | ✅ | Aucun |

---

## ✅ Conformité contenu (Policy)

| Règle | Statut MaaS | Clarification |
|-------|-------------|---------------|
| Suppression/modification si contenu retiré sur X | ✅ | On ne stocke pas le contenu des tweets, uniquement des métriques |
| Respect protected/blocked | ✅ | On n'accède qu'aux comptes publics ou autorisés (OAuth KOL) |

---

## ✅ User protection (Agreement XIV.B)

| Règle | Statut MaaS |
|-------|-------------|
| Pas de surveillance / renseignement | ✅ |
| Pas de ciblage sur données sensibles | ✅ |
| Pas de suivi d'événements sensibles | ✅ |

---

## ✅ Data Protection Addendum (Agreement XIV.E)

- L'utilisation est soumise au [Controller-to-Controller Addendum](https://gdpr.x.com/en/controller-to-controller-transfers.html) de X.

---

## Actions recommandées

1. **Souscrire au tier Pro ou Enterprise** pour usage commercial.
2. **Publier une Privacy Policy** visible avant inscription/sign-up.
3. **Conserver un journal d'audit** des accès API (logs) — X peut demander des preuves (Agreement § VIII). MaaS écrit automatiquement dans `backend/logs/maas-api.log` (requêtes API, horodatage). Pour les appels directs à l'API X, utiliser `req.app.locals.auditLog('X_API_CALL', { endpoint, campaignId })`.
4. **Mettre à jour X** en cas de changement substantiel du cas d'usage.
