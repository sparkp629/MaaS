# Rappel : onboarding → dashboard (à ressortir au moment de l’implémentation)

**Contexte** : Les réponses du sondage d’onboarding (7 questions en 4 étapes) doivent alimenter les données du dashboard. L’interface du dashboard (blocs, emplacements, formes) reste la même ; ce qui change, c’est le **contenu** des blocs (rempli par les réponses + plus tard les données APIs).

**Au moment où tu implémenteras** :
- le stockage des réponses (localStorage puis Supabase), ou
- le branchement de ces réponses dans le dashboard (filtres, recommandations, personnalisation),

**se rappeler** : garder l’onboarding actuel ; à la fin, enregistrer les réponses ; le dashboard lit ces réponses (et plus tard les données APIs) pour remplir les mêmes blocs. Pas de changement de structure d’écran, uniquement des données qui alimentent les blocs existants.

Référence détaillée : `docs/DASHBOARD_VISUAL_AND_BACKEND_PROMPT.md` (section 4).
