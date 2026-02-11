# Vérification React2Shell (CVE-2025-55182)

## Résultat : NON VULNÉRABLE ✓

MaaS utilise **Vite + React client-side**, pas Next.js ni React Server Components (RSC).
La vulnérabilité React2Shell affecte uniquement les applications Next.js avec RSC.

## Commande de vérification exécutée

```bash
# 1. Cloner le scanner officiel Assetnote
git clone --depth 1 https://github.com/assetnote/react2shell-scanner.git .security-check/react2shell-scanner

# 2. Installer les dépendances
cd .security-check/react2shell-scanner
pip install -r requirements.txt

# 3. Lancer le scan (mode safe-check, sans exécution de code)
python scanner.py -u http://localhost:5173 --safe-check
```

## Résultat du scan

```
[NOT VULNERABLE] http://localhost:5173 - Status: 404

SCAN SUMMARY
  Total hosts scanned: 1
  Vulnerable: 0
  Not vulnerable: 1
  Errors: 0
```

Le 404 indique que l'app Vite ne répond pas aux endpoints RSC attendus par le scanner — ce qui confirme l'absence de RSC.

## Ré-exécuter la vérification

Pour tout nouveau projet ou déploiement :

```bash
cd .security-check/react2shell-scanner
python scanner.py -u https://votre-domaine.com --safe-check
```
