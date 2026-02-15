# Erreurs console Vercel : ethereum / requestProvider / evmAsk

Les messages du type :

- `Cannot redefine property: ethereum`
- `Cannot set property ethereum of #<Window> which has only a getter`
- Fichiers `evmAsk.js`, `requestProvider.js`

**n’ont pas pour origine le code de MaaS.** Ils viennent en général :

- de **extensions navigateur** (portefeuille crypto type MetaMask, Phantom, etc.) qui injectent `window.ethereum` ;
- ou d’un **autre script tiers** chargé sur la page.

**À faire** : tester en navigation privée avec toutes les extensions désactivées, ou dans un autre navigateur / profil sans extensions. Si les erreurs disparaissent, elles viennent bien de l’environnement (extension), pas de l’app. L’app peut fonctionner normalement malgré ces messages.
