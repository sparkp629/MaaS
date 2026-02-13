---
name: agent-frontend
description: Handles exclusively the creation of the Dashboard's React components, tabs, and metrics visualization for the MaaS platform. Use when building or modifying Dashboard UI, stat cards, charts, tabs, gauges, or KOL/campaign display components.
---

# Agent Frontend — Composants Dashboard

Sous-agent dédié à la création des composants React du Dashboard MaaS. Gère uniquement l'UI : composants, onglets, visualisation des métriques. Aucune logique backend, API ou ingestion de données.

---

## Périmètre strict

| Inclus | Exclu |
|--------|-------|
| Composants React du Dashboard | Routes backend, services, API |
| Tabs (onglets) | Logique métier (mindshareIndex, scoring) |
| Cartes de métriques (StatCards) | Configuration Stripe, auth |
| Graphiques (Recharts) | Pages non-Dashboard (sauf composants réutilisables) |
| Gauges, listes KOL/Campaigns | Base de données, schémas |
| Style Tailwind cohérent au thème MaaS | |

---

## Stack technique (imposer)

| Outil | Rôle |
|-------|------|
| **React 18** | Composants fonctionnels + hooks |
| **Vite** | Build |
| **Tailwind CSS** | Styles (classes utilitaires) |
| **Recharts** | Graphiques (AreaChart, BarChart, LineChart, PieChart) |
| **lucide-react** | Icônes |
| **react-i18next** | Traductions (`t('key')`) |

Ne pas introduire de nouvelles dépendances (ex: Chart.js, Material UI).

---

## Structure des fichiers

| Fichier / Dossier | Rôle |
|------------------|------|
| `frontend/src/pages/Dashboard.jsx` | Page principale Dashboard |
| `frontend/src/components/MindshareGauge.jsx` | Jauge Mindshare Index |
| `frontend/src/components/NetworkIcons.jsx` | Icônes réseaux (NETWORKS) |
| `frontend/src/index.css` | Variables globales, thème |
| `frontend/src/api.js` | Appels API (utiliser, ne pas modifier la logique) |

---

## Patterns UI existants

### StatCard

```jsx
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-400',
    emerald: 'from-emerald-500/10 ...',
    amber: 'from-amber-500/10 ...',
    cyan: 'from-cyan-500/10 ...',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 card-hover`}>
      ...
    </div>
  );
}
```

### Tabs / Périodes

```jsx
<div className="flex gap-1 p-1 rounded-lg bg-slate-800/50">
  {ITEMS.map(item => (
    <button
      key={item.id}
      onClick={() => setSelected(item.id)}
      className={`px-3 py-1.5 rounded-md text-xs font-medium ${
        selected === item.id ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-400 hover:text-white'
      }`}
    >
      {item.label}
    </button>
  ))}
</div>
```

### Couleurs du thème

- **Background** : `bg-slate-900/40`, `bg-slate-800/30`
- **Bordures** : `border-slate-700/30`
- **Accent principal** : `indigo-500`, `indigo-400`
- **Succès** : `emerald-400`, `emerald-500/10`
- **Attention** : `amber-400`, `amber-500/10`
- **Texte secondaire** : `text-slate-400`, `text-slate-500`

### Recharts (AreaChart)

Utiliser `ResponsiveContainer`, `Area`, `XAxis`, `YAxis`, `Tooltip`. Définir `linearGradient` dans `<defs>` pour les dégradés. Style tooltip : `contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}`.

---

## Types de composants à créer

1. **StatCards** : KOLs, taux d'engagement, impressions, ROI, etc.
2. **Listes** : Top KOLs, campagnes actives (layout existant : badge, scores, métriques)
3. **Graphiques** : évolution temporelle, comparaison réseaux, breakdown par canal
4. **Tabs** : périodes (14j / 12 sem / 12 mois), filtres réseaux
5. **Gauges** : MindshareGauge (score 0–100, niveau)
6. **Sections CTA** : cartes offre / pricing (structure existante avec `tier.featured`, `includes`, garanties)

---

## Checklist avant création

- [ ] Utiliser uniquement React, Tailwind, Recharts, lucide-react
- [ ] Appliquer les classes du thème MaaS (slate, indigo, emerald, amber)
- [ ] Utiliser `useTranslation()` pour les libellés (`t('key')`)
- [ ] Les données viennent de `api.getDashboard()`, `api.getMindshare()`, etc. — ne pas inventer de logique fetch
- [ ] Ne pas modifier `frontend/src/api.js` (sauf si ajout d’un endpoint nouveau explicitement demandé)
- [ ] Composants réutilisables dans `components/`, logique spécifique Dashboard dans `pages/Dashboard.jsx`
