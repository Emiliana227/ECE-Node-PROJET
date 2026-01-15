console.log(">>> INDEX.JS CHARGÉ <<<");

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

  console.log("MongoDB connecté : GestionnaireProjets");

  // ============ ROUTES MONITORING (POUR L'ÉTAPE 7) ============
  app.get('/', (req, res) => {
    res.send('OK depuis /');
  });

  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      mongodb: db ? 'connected' : 'disconnected'
    });
  });

  app.get('/metrics', async (req, res) => {
    try {
      const stats = {
        application: {
          name: 'ECE-Node-PROJET',
          version: '2.0.0',
          uptime_seconds: Math.floor(process.uptime())
        },
        database: {
          totalUsers: await users.countDocuments(),
          totalProjets: await projets.countDocuments(),
          totalTaches: await taches.countDocuments()
        },
        system: {
          memory: {
            used_mb: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024),
            total_mb: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024)
          },
          node_version: process.version
        }
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Import (pour tes données de test)
  app.post('/import', async (req, res) => {
    try {
      const { filePath } = req.body;
      if (!filePath) return res.status(400).json({ error: 'Le chemin du fichier est requis' });
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      const result = await importData(db, data);
      res.status(result.success ? 200 : 500).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(3000, () => console.log("API disponible sur http://localhost:3000"));
}

startServer();
