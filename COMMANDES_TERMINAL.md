# Commandes terminal — 3 URLs locales

Tu dois lancer **3 terminaux** différents (chacun garde un serveur ouvert).  
Un seul terminal = une seule URL qui marche.

---

## Terminal 1 — déjà OK (5173)

```powershell
cd c:\Users\Admin\OneDrive\Bureau\ProjetsPerso\MaaS\frontend
npm run dev:default
```

→ http://localhost:5173

---

## Terminal 2 — pour 5174

**Ouvre un NOUVEAU terminal** (onglet ou fenêtre), puis :

```powershell
cd c:\Users\Admin\OneDrive\Bureau\ProjetsPerso\MaaS\frontend
npm run dev:dashboard
```

→ http://localhost:5174

---

## Terminal 3 — pour 5175

**Ouvre un AUTRE terminal**, puis :

```powershell
cd c:\Users\Admin\OneDrive\Bureau\ProjetsPerso\MaaS\frontend
npm run dev:login
```

→ http://localhost:5175

---

## Résumé

| Terminal | Commande | URL |
|---------|----------|-----|
| 1 | `cd frontend` puis `npm run dev:default` | http://localhost:5173 |
| 2 | `cd frontend` puis `npm run dev:dashboard` | http://localhost:5174 |
| 3 | `cd frontend` puis `npm run dev:login` | http://localhost:5175 |

Chaque commande bloque le terminal tant que le serveur tourne. Ne ferme pas le terminal pour garder l’URL active.
