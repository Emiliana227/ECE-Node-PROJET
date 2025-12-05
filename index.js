import express from "express";
import { connect } from "./db/mongoClient.js";
import { importData } from "./import.js";
import fs from "fs/promises";

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

app.post('/users', async (req, res) => {
  try {
    const user = { ...req.body, created_a: new Date().toISOString() };
    const result = await db.collection('users').insertOne(user);
    res.status(201).json({ _id: result.insertedId, ...user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/users', async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query;
    const filter = role ? { role } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const user = await db.collection('users').find(filter).skip(skip).limit(parseInt(limit)).toArray();
    const total = await db.collection('users').countDocuments(filter);
    res.json({ user, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


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




