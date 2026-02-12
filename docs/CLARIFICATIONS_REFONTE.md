# Clarifications sur les formulations — Refonte Dashboard

## Interprétations effectuées

| Formulation | Interprétation |
|-------------|----------------|
| `flex flex-wrap- gap2` | `flex flex-wrap gap-2` (typo) |
| `text -sm font-semibold text-white` | `text-sm font-semibold text-white` |
| `glass rounaded-2x1` / `lg:col-spam-2` | `glass rounded-2xl` / `lg:col-span-2` |
| `gird md:gird-cols-3` | `grid md:grid-cols-3` |
| `frid grid-cols-2` | `grid grid-cols-2` |
| **Remplacer `bg-gradient-to-br-from-violet`** | La StatCard violette (Campagnes Actives) affiche désormais une métrique calculée depuis des données locales/API peu coûteuses — ex. **Taux d'engagement moyen** (likes+replies/impressions) issu du DB |
| **Section `glass rounded-2xl p-6` à remplacer** | La section contenant le Mindshare Gauge + graphique est remplacée par : aperçu du contenu le plus engagé par réseau (X, LinkedIn, YouTube, Newsletter), avec switcher d’icônes et bouton « Générer » désactivé |
| **« Replace grid lg:grid-cols-2 au-dessus de... »** | Réorganiser la disposition : le bloc Mindshare/Chart et la nouvelle section « contenu engagé » sont réorganisés |
| **« mt-4 p-3 rounded-xl bg-amber-500/5... au-dessus de grid md:grid-cols-3 »** | Déplacer le bloc urgence/social proof au-dessus des tiers de prix |
| **Traduction invisible** | Détection automatique de la langue du navigateur (`navigator.language`), affichage dans cette langue, aucune UI visible (pas de sélecteur) |
| **Aucun fichier téléchargeable** | Aucun lien/bouton d’export ou de téléchargement dans le dashboard client |

## Points non couverts (à préciser si besoin)

- **Analyse LLM du code SaaS** : flow prévu après connexion GitHub ; implémentation backend à faire (pour l’instant flux simulé).
- **Justification « pourquoi, sur quel canal »** : emplacement exact dans l’UI (modal, tooltip, section dédiée) à préciser.
