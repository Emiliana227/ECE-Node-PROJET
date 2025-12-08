import express from "express";
import { connect } from "./db/mongoClient.js";
import { importData } from "./import.js";
import fs from "fs/promises";
import { writeBackupAsync } from "./backupWriterAsync.js";
import { ObjectId } from "mongodb";

const app = express();
app.use(express.json());

let db, projets, taches, users;

async function startServer() {
  db = await connect();
  projets = db.collection("projets");
  taches = db.collection("taches");
  users = db.collection("users");

  app.listen(3000, () => console.log("API disponible sur http://localhost:3000"));
}

startServer();

//route import 
app.post('/import', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'Le chemin du fichier est requis' });
    }

    // Lire le fichier JSON
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    // Importer les données
    const result = await importData(db, data);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//
// route backup asynchrone Export complet de la base
app.post("/backup-async", async (req, res) => { 
  try {

    // Récupération de toutes les données depuis MongoDB
    const backupData = {
      date: new Date().toISOString(),         
      users: await users.find().toArray(),     // Collection Users
      projets: await projets.find().toArray(), // Collection Projets
      taches: await taches.find().toArray()    // Collection Taches
    };

    
    const filename = `backup-${Date.now()}.json`;

    // Écriture du backup dans /data/ en mode asynchrone
    const result = await writeBackupAsync(filename, backupData);

    
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Réponse envoyée au client
    res.json({
      success: true,
      message: "Backup asynchrone créé avec succès",
      file: result.file   // 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// route  POST /users
// Créer un nouvel utilisateur dans la base de données

app.post('/users', async (req, res) => {
  try {
    const user = { ...req.body, created_a: new Date().toISOString() }; 
    const result = await db.collection('users').insertOne(user);
    res.status(201).json({ _id: result.insertedId, ...user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// route GET /users?role=ADMIN&page=1&limit=10
// Rechercher des utilisateurs avec filtres et pagination

app.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = role ? { role } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await db.collection('users').find(filter).skip(skip).limit(parseInt(limit)).toArray();
    const total = await db.collection('users').countDocuments(filter);
    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

 //route GET /users/stats/monthly
// (pipeline)Agrégation: Statistiques de création des utilisateurs par mois/année

app.get('/users/stats/monthly', async (req, res) => {
  try {
    const stats = await db.collection('users').aggregate([
      {
        $project: {
          month: { $month: { $dateFromString: { dateString: '$created_a' } } },
          year: { $year: { $dateFromString: { dateString: '$created_a' } } }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]).toArray();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// PUT /taches/:id
// Modifier une tâche existante (tous les champs modifiables)
// Params: id (identifiant de la tâche)
// Body: champs à modifier
app.put('/taches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('taches').updateOne(
      { _id: id },
      { $set: req.body }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Tache not found' });
    }
    const updatedTache = await db.collection('taches').findOne({ _id: id });
    res.json(updatedTache);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /taches/assigned/:userId
// Filtrer les tâches assignées à un utilisateur spécifique
app.get('/taches/assigned/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const taches = await db.collection('taches').find({ assignee_a: userId }).toArray();
    res.json(taches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  GET /taches/stats/assignees
// Agrégation: Nombre de tâches par utilisateur assigné
// Pipeline: regroupement par assignee_a → comptage → tri par nombre décroissant
app.get('/taches/stats/assignees', async (req, res) => {
  try {
    const stats = await db.collection('taches').aggregate([
      {
        $group: {
          _id: '$assignee_a',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//  POST /taches
//  Ajouter une nouvelle tâche dans la base
app.post('/taches', async (req, res) => {
  try {
    // On récupère tout le contenu envoyé dans le body
    // et on ajoute la date actuelle sous created_a
    const tache = { 
      ...req.body, 
      created_a: new Date().toISOString() 
    };

    // On insère la tâche dans MongoDB
    const result = await db.collection('taches').insertOne(tache);

    // On renvoie la tâche créée avec son ID généré par MongoDB
    res.status(201).json({ 
      _id: result.insertedId, 
      ...tache 
    });

  } catch (error) {
    // Si quelque chose ne va pas → erreur serveur
    res.status(500).json({ error: error.message });
  }
});



// GET /taches
// Filtrer les tâches par statut (+ pagination + filtre date)
// Exemples :
//   /taches?status=TODO
//   /taches?page=2&limit=5
//   /taches?start=2025-01-01&end=2025-01-31
app.get('/taches', async (req, res) => {
  try {
    // On récupère les paramètres de l’URL
    const { status, page = 1, limit = 5, start, end } = req.query;

    // Objet de filtre utilisé dans MongoDB
    const filter = {};

    // Si un status est envoyé → on filtre dessus
    if (status) filter.status = status;

    // Si start + end envoyés → filtre entre 2 dates
    if (start && end) {
      filter.created_a = {
        $gte: start,
        $lte: end
      };
    }

    // Calcul pour la pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // On récupère les tâches selon le filtre + pagination
    const taches = await db.collection('taches')
      .find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // On compte le nombre total de tâches correspondant au filtre
    const total = await db.collection('taches').countDocuments(filter);

    // On renvoie les résultats + infos de pagination
    res.json({
      taches,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// GET /taches/stats/status
// Faire des statistiques : combien de tâches par statut ?
app.get('/taches/stats/status', async (req, res) => {
  try {
    // Pipeline d'agrégation MongoDB :
    // 1) regroupe par "status"
    // 2) compte le nombre
    // 3) trie par ordre décroissant
    const stats = await db.collection('taches').aggregate([
      {
        $group: {
          _id: '$status',   // on regroupe par status
          count: { $sum: 1 } // on compte les tâches
        }
      },
      { $sort: { count: -1 } } // plus grand → plus petit
    ]).toArray();

    // On renvoie les statistiques
    res.json(stats);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
