# Si le site https://maa-s.vercel.app affiche encore une erreur 404

La config du projet est prête. Si après un nouveau déploiement la page reste 404 :

1. Ouvre ton projet sur Vercel (onglet **Settings**).
2. Trouve le champ **Root Directory**.
3. Clique sur **Edit**, mets : **frontend** (sans slash), puis enregistre.
4. Redéploie (onglet Deployments → les trois points sur le dernier déploiement → Redeploy).

Ensuite réessaie d’ouvrir l’URL de ton déploiement (ex. **https://maa-s.vercel.app** ou l’URL de preview Vercel type `maa-s-git-main-…vercel.app`).
