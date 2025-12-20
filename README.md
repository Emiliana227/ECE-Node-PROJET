# ECE-Node.js-PROJET

Projet Backend Node.js & MongoDB – Gestion de Projets et Tâches
1. Présentation du sujet

Ce projet consiste à développer une API backend complète en Node.js (Express) connectée à une base de données MongoDB, dans le cadre du cours « Base de données – NoSQL ».

Le contexte fonctionnel choisi est un gestionnaire de projets et de tâches permettant :

la gestion des utilisateurs (rôles ADMIN / USER),

la création et le suivi de projets,

l’assignation et le suivi de tâches,

la production de statistiques avancées via des agrégations MongoDB,

l’import et l’export (backup) de données au format JSON.

L’objectif principal est de démontrer la capacité à concevoir un backend structuré, cohérent et maintenable, intégrant des opérations CRUD, des agrégations, la manipulation de fichiers JSON et les bonnes pratiques Node.js.

2.Architecture du projet

ece-node-projet/
│
├── db/
│   └── mongoClient.js        # Connexion MongoDB via MongoClient
│
├── data/
│   ├── import.json           # Données d’import
│   └── backup-xxxxx.json     # Fichiers de backup générés
│
├── index.js                  # Point d’entrée de l’API (routes et serveur)
├── import.js                 # Logique d’import JSON vers MongoDB
├── backupWriterAsync.js      # Écriture asynchrone des backups
│
├── package.json
├── package-lock.json
├── .env                      # Variables d’environnement (MongoDB URI)
└── README.md

Technologies utilisées

Node.js

Express

MongoDB (driver officiel)

ES Modules (type: module)

dotenv

fs/promises pour la gestion des fichiers JSON

3. Modèle des données
   
Collection users
{
  "_id": "u1",
  "username": "admin",
  "password": "hashed_password",
  "role": "ADMIN",
  "created_a": "2025-01-01T10:00:00Z"
}

Collection projets
{
  "_id": "p1",
  "titre": "Application JavaFX",
  "description": "Développement application desktop",
  "created_a": "2025-01-08T09:00:00Z"
}

Collection taches
{
  "_id": "t1",
  "projet_id": "p1",
  "titre": "Configurer JavaFX",
  "description": "Préparer la fenêtre principale",
  "status": "TODO",
  "assignee_a": "u2",
  "created_a": "2025-01-10T09:00:00Z"
}


Relations entre collections :

taches.projet_id référence projets._id

taches.assignee_a référence users._id

4. Exemples d’appels API
Créer un utilisateur
POST /users
Content-Type: application/json

{
  "username": "alice",
  "password": "hashed_password",
  "role": "USER"
}

Lire les utilisateurs avec filtres et pagination
GET /users?role=ADMIN&page=1&limit=10

Statistiques mensuelles des utilisateurs
GET /users/stats/monthly

Ajouter une tâche
POST /taches

Filtrer les tâches
GET /taches?status=TODO&page=1&limit=5

Statistiques des tâches par statut
GET /taches/stats/status

Top 3 des projets avec le plus de tâches
GET /projets/stats/top-taches

Import de données JSON
POST /import

Export et sauvegarde complète de la base
POST /backup-async

5.Instructions d’installation
5.1. Cloner le dépôt
git clone https://github.com/Devofmay/ECE-Node-PROJET.git
cd ece-node-projet

5.2. Installer les dépendances
npm install

5.3. Configurer l’environnement

Créer un fichier .env à la racine du projet :
PORT=3000
MONGO_URI=//.....

4. Lancer le serveur
node index.js


L’API est accessible à l’adresse suivante :
http://localhost:3000
