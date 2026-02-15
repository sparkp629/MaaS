# Pourquoi l’écran « Loading » au démarrage ?

En une phrase : **au tout premier instant où la page s’ouvre (ou se rafraîchit), le code n’a pas encore pu lire si une session existe** (localStorage ou Supabase). Pendant ce tout petit délai (souvent moins d’une seconde), on ne sait pas encore afficher la landing ou le dashboard.

- **Sans** écran de chargement : l’app affiche par exemple la landing, puis dès que la lecture est finie elle bascule vers le dashboard → l’utilisateur voit un « saut » ou un flash.
- **Avec** écran de chargement : pendant ce court instant on affiche « Loading… », puis dès qu’on sait (connecté ou non), on affiche directement la bonne page. Pas de flash.

Donc ce n’est pas qu’on « ne sait pas en général » si l’utilisateur est connecté ; c’est uniquement **le tout premier moment au chargement de la page**, le temps de lire le stockage. Une fois que c’est lu, on sait et on affiche la bonne chose. Le bouton « Voir ce que je manque » ne change pas ce fait : après un clic, on est déjà « connecté » et la suite se passe normalement.
