---
name: clean-deps
description: Analyze project dependencies and suggest removing unused or obsolete packages to keep the stack Lean. Use when the user asks to audit dependencies, clean packages, reduce bundle size, or keep the stack minimal.
---

# Clean Deps

Analyse les dépendances du projet (npm, pnpm, yarn) et propose de supprimer les packages inutiles ou obsolètes pour une stack Lean.

## Périmètre

- **Inclus** : Analyse package.json, détection packages inutilisés, obsolètes, doublons
- **Exclu** : Ajout de packages, logique métier, UI

---

## Exemples de prompts (quand m'invoquer)

- « Auditer les dépendances du projet »
- « Supprimer les packages inutilisés »
- « Réduire la taille du bundle frontend »
- « Remplacer moment par dayjs »
- « Vérifier les packages obsolètes »

---

## Quand ne pas m'invoquer

- Implémentation d'une feature → compétence par défaut
- UI, composants → `agent-frontend`
- Config Auth, Stripe → `core-infra`

---

## Workflow d'analyse

### 1. Inventorier les dépendances

Lire tous les `package.json` du projet (root, frontend, backend, packages partagés).

Pour chaque projet :
- Lister les `dependencies` et `devDependencies`
- Repérer les versions (^, ~, exacte)
- Noter les alias ou packages optionnels

### 2. Vérifier l'usage réel

Pour chaque package, rechercher dans le code source :
- Imports (`require()`, `import`)
- Références dans config (vite.config.js, tailwind.config.js, etc.)
- Scripts npm qui invoquent des binaires (ex. `postcss`, `tailwindcss`)
- Références indirectes (plugin qui charge un autre package)

**Packages souvent invisibles mais utilisés** : PostCSS, Tailwind, plugins Vite, loaders, babel.

### 3. Identifier les candidats à suppression

| Critère | Exemple | Action |
|--------|---------|--------|
| Jamais importé ni référencé | `uuid` si non utilisé | Supprimer |
| Doublon fonctionnel | `lodash` + `lodash-es` | Garder un seul |
| Déprécié / obsolète | Package remplacé par un autre | Migrer puis supprimer |
| Transitive inutile | Dépendance d’une dépendance déjà supprimée | Vérifier après suppression |
| Dev en prod | `@types/*` en dependencies | Déplacer en devDependencies |
| Polyfill obsolète | Polyfill pour vieux navigateurs si cible moderne | Supprimer si non requis |

### 4. Vérifier les obsolètes

- `npm outdated` ou équivalent (sans modifier, lecture seule)
- Packages en `deprecated` sur npm
- Versions majeures obsolètes (ex. React 16 vs 18)
- Préférer les alternatives plus légères (ex. dayjs vs moment)

### 5. Produire le rapport

---

## Format de sortie

```markdown
# Audit dépendances — [nom du projet]

## Synthèse
- X packages analysés
- Y candidats à suppression
- Z packages obsolètes à mettre à jour

## À supprimer (non utilisés)

| Package | Projet | Raison |
|---------|--------|--------|
| uuid    | backend | Jamais importé |

## À migrer / remplacer

| Package | Alternative | Raison |
|---------|-------------|--------|
| moment  | dayjs       | Plus léger, moment déprécié |

## À déplacer

| Package | De → À | Raison |
|---------|--------|--------|
| @types/X | dependencies → devDependencies | Types TS uniquement |

## Obsolètes (optionnel)

| Package | Actuel | Dernier | Action suggérée |
|---------|--------|---------|-----------------|
| express | 4.18  | 4.21   | Mettre à jour   |

## Commandes proposées

\`\`\`bash
cd backend && npm un uuid
cd frontend && npm un [package]
\`\`\`
```

---

## Règles Lean

1. **Un besoin, un package** : éviter les doublons (ex. deux libs de dates).
2. **Dev séparé** : tout ce qui sert au build/test va en devDependencies.
3. **Transitives** : ne pas installer une transitive en direct sauf nécessité.
4. **Taille** : privilégier les alternatives légères (date-fns vs moment, etc.).
5. **Maintenance** : privilégier les packages actifs et maintenus.

---

## Outils utiles (suggestion, pas obligatoire)

- `npx depcheck` : détecte les packages non utilisés
- `npm ls --depth=0` : liste les dépendances directes
- `npm outdated` : liste les versions obsolètes
- Vérification manuelle des imports avec grep/ripgrep

L’agent peut exécuter `depcheck` ou équivalent pour corroborer les suggestions.
