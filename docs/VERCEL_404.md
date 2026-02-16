# Si le domaine Vercel affiche un mauvais `index.html` ou une 404

Le repo est configure pour builder depuis la racine via `vercel.json`.

## Verification unique a faire dans Vercel

1. Ouvre le projet Vercel > **Settings** > **General**.
2. Verifie **Root Directory** : il doit etre vide (racine du repo), **pas** `frontend` et surtout **pas** `frontend/src`.
3. Redeploie le dernier build (**Deployments** > menu du dernier deploy > **Redeploy**).

## Pourquoi

- Le `vercel.json` racine lance `npm run build --prefix frontend` et publie `frontend/dist`.
- Si le Root Directory pointe sur un sous-dossier, Vercel peut ignorer cette config et servir une mauvaise entree.
