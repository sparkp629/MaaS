# Direction artistique et technique (MaaS)

## Principes généraux

- **Landing** : slogan fort, CTA unique « Voir ce que je manque », pas de bouton « connexion » visible. L’utilisateur est invité à découvrir, pas à s’identifier.
- **Onboarding** : 7 questions en 4 étapes, ton « complices » (accroches par étape). Les réponses fermées sont à penser stratégiquement, car elles alimentent les données du dashboard ; l’interface du dashboard ne change pas selon la nature du SaaS client.
- **Dashboard** : outil principal après onboarding. Affichage des données extraites (KOLs, intelligence, ROI) dans des blocs définis ; pas de look « outils d’analyse classiques » (cartes, tableaux, graphiques type affiches). Visée : **intuitif**, lisible, distinct.

## Stack et déploiement

- Frontend : React 18, Vite, Tailwind, React Router.
- Backend : Node, Express ; APIs optionnelles (mock/samples si non configurées).
- Auth : mock par défaut ; Supabase pour données (sondage, extractions) et auth réelle plus tard si besoin. Pas de dépendance à GitHub OAuth dans la direction produit.
- Déploiement : Vercel (SPA avec rewrites). Données hébergées ailleurs (ex. Supabase), pas sur Vercel.

Les changements de direction artistique ou technique décrits ici peuvent être appliqués sans demander de validation à chaque fois, tant qu’ils restent cohérents avec ce document.
