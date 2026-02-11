# RGPD & Infrastructure — Faut-il utiliser AWS ?

## Réponse courte

**Non, AWS n'est pas indispensable pour la conformité RGPD.** Pour le MaaS, héberger en Europe (OVH, Scaleway, Hetzner, Supabase EU) est souvent **préférable** pour éviter les risques liés au transfert de données hors UE (Privacy Shield invalide, CLOUD Act US, etc.).

## Analyse pour le MaaS

### Ce que le MaaS doit stocker / traiter

| Donnée | Volume | Sensibilité | Besoin RGPD |
|--------|--------|------------|-------------|
| Métriques agrégées (impressions, likes, vues) | Faible | Faible | Pas de données personnelles directes |
| Profils KOL (nom, handle, avatar_url, liens) | Moyen | Faible | Données publiques |
| Contenu généré (hooks, posts) | Moyen | Moyenne | Contenu créé par le service |
| Repo GitHub analysé (structure, langue, dépendances) | Faible | Variable | Analyse technique uniquement, pas de code stocké durablement |
| Suggestions anonymes (hash fingerprint) | Faible | Très faible | Anonymisées par design |

### Recommandation : Éviter AWS pour simplifier

1. **Hébergeurs EU-first** : OVH, Scaleway, Hetzner, DigitalOcean (région Frankfurt) garantissent que les données restent dans l'UE.
2. **Supabase** : Propose des régions EU (Frankfurt). Base de données + Auth + Realtime. Idéal pour le MaaS.
3. **Vercel / Netlify** : Pour le frontend, régions EU disponibles. Edge Functions pour le backend léger.
4. **Pas de besoin de services AWS spécifiques** : Lambda, S3, etc. peuvent être remplacés par des équivalents (Vercel Serverless, Supabase Storage, R2 Cloudflare en EU).

### Pour l'analyse de contenu (matching repo → SaaS)

- **Traitement** : L'analyse du repo (dépendances, structure, README) peut être faite en mémoire ou via une fonction serverless.
- **Stockage** : Seules les **résultats** de l'analyse (ex. : "niche: AI Tools, stack: React") sont stockés, pas le code source.
- **Charte utilisateur** : "Nous ne conservons pas le code ; nous analysons uniquement pour déterminer la nature du SaaS et proposer du contenu."

### Conclusion

**Utilisez Supabase (région EU) + Vercel/Netlify (EU) plutôt qu'AWS.** Plus simple, meilleur pour la RGPD, et suffisant pour les besoins du MaaS. AWS ne devient pertinent que pour des volumes très importants ou des besoins AWS-specific (ML SageMaker, etc.).
