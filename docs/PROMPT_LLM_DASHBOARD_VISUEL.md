# Prompt pour un autre LLM : modifier le dashboard sans changer ce qui ne doit pas changer

Utilise ce prompt pour demander à un autre modèle de modifier l’affichage de certaines métriques ou blocs du dashboard, en évitant qu’il change l’apparence des éléments qui doivent rester tels quels.

---

## Instructions à donner à l’autre LLM (copier-coller ou adapter)

Tu dois modifier le **frontend du dashboard MaaS** (affichage de certaines métriques ou blocs). Pour éviter de changer ce qui ne doit pas changer :

1. **Source de vérité pour la structure actuelle**  
   Utilise **uniquement le code source** pour connaître les emplacements, composants et champs affichés. Les fichiers à lire en priorité sont :
   - `frontend/src/pages/Dashboard.jsx` — structure de la page, ordre des sections, composants (PeriodSelector, TrendCard, NetworkFilters, KOLCard, IntelligenceSection, MindshareGauge), noms des labels et des props.
   - `frontend/src/components/MindshareGauge.jsx` — jauge circulaire (valeurs, niveaux, tailles).
   - `frontend/src/components/NetworkIcons.jsx` — icônes réseaux et tailles.

2. **Ne pas se fier à une description textuelle seule**  
   Toute description dans un doc (y compris ce fichier) peut être incomplète ou décalée. Le **code source** est la référence pour :
   - quels blocs existent et où ils sont (ordre dans le JSX) ;
   - quelles métriques sont affichées et sous quel libellé ;
   - quelles classes CSS ou composants définissent la forme actuelle.

3. **Si tu as accès à une capture d’écran (OCR / vision)**  
   Tu peux l’utiliser en **complément** pour vérifier le rendu visuel (positions, textes visibles). En cas de contradiction entre le code et l’image, privilégier le **code** pour la structure et les emplacements, et l’image seulement pour confirmer le rendu.

4. **Règle de non-modification**  
   Tout élément du dashboard **non cité explicitement** dans la demande de modification doit rester **inchangé** (ordre, libellés, composants, styles). Seuls les éléments explicitement listés dans la demande (ex. « changer l’affichage de la jauge », « modifier le bloc High-demand segments ») peuvent être modifiés.

5. **Référence des contraintes de design**  
   Avant de proposer un nouveau rendu pour les données, lire le fichier `docs/DASHBOARD_VISUAL_AND_BACKEND_PROMPT.md` (sections 1 et 2) : contraintes sur l’intuitif, l’interdit des cartes/tableaux/graphiques classiques, et la liste des blocs à garder ou à faire évoluer.

---

En résumé : **pour “voir” le frontend actuel du dashboard et ne pas changer ce qui ne doit pas changer, utilise le code source comme référence précise ; l’OCR ou une capture ne font que compléter si besoin.**
