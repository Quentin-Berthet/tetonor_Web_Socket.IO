# Tetonor

## Exécuter le projet
- Clonez le dépôt `git clone ssh://git@ssh.hesge.ch:10572/baptiste.coudray/tetonor.git`
- Naviguez dans le dépot `cd tetonor`
- Installez les dépendances `npm install`
- Lancez le projet `npm start`
- Le jeu est accessible via [Localhost](http://127.0.0.1:3000/)

## Déroulement du jeu
- Le jeu commence lorsque 2 joueurs se sont connectés.
    - Quand il n'y a qu'un joueur, un message lui indique qu'il doit attendre un deuxième joueur.
- Le jeu se termine lorsque tous les problèmes sont résolus ou lorsqu'il n'y a plus de solution possible.
- Concernant la production d'une grille et des calculs :
    - nous générons aléatoirement 12 chiffres entre 1 et 10 compris que nous stockons dans une liste `additions`
        - quand deux chiffres sont générés, nous les additionnons et stockons le résultat dans une liste `results.additions`
    - nous générons aléatoirement 12 chiffres entre 1 et 10 compris que nous stockons dans liste `multiplications`
        - quand deux chiffres sont générés, nous les multiplions et stockons le résultat dans une autre liste `results.multiplications`
    - Nous concatenons la liste `additions` et `multiplications` puis nous mélangeons les valeurs du tableau résultant pour obtenir une grille aléatoire (`grid.numbers`)
    - Finalement, la grille est envoyée aux clients (`grid.numbers`) ainsi que les résultats additions/multiplications (`results.additions`, `results.multiplications`)

## Structure du projet
- Front-end
    - HTML + CSS + JS, disponible dans le dossier `public`
- Back-end
    - NodeJS (ExpressJS), le fichier `app.js` contient le code du serveur
- Communication
    - Socket.IO

## Répartition du travail
- Quentin Berthet
    - Front-end
    - Drag & Drop
    - Socket.IO
    - Commencement de la verification des calculs
- Baptiste Coudray
    - Algorithme de génération de grille + résultats
    - Début/fin de la partie
    - Finition de la verification des calculs
    - Amélioration du code JavaScript (Vanilla) -> jQuery

## Auteurs
- Quentin Berthet
- Baptiste Coudray
