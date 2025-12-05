import express from 'express';
import { connect } from './db/mongoClient.js';

const app = express();
app.use(express.json());

export async function importData(db, data) {
    try {
        // Insert users
        if (data.users && Array.isArray(data.users)) {
            const usersCollection = db.collection('users');
            await usersCollection.insertMany(data.users);
            console.log(`✓ Importé ${data.users.length} users`);
        }

        // Insert projets
        if (data.projets && Array.isArray(data.projets)) {
            const projetsCollection = db.collection('projets');
            await projetsCollection.insertMany(data.projets);
            console.log(`✓ Importé ${data.projets.length} projets`);
        }

        // Insert taches
        if (data.taches && Array.isArray(data.taches)) {
            const tachesCollection = db.collection('taches');
            await tachesCollection.insertMany(data.taches);
            console.log(`✓ Importé ${data.taches.length} taches`);
        }

        console.log('Import des données terminé avec succès !');
        return { success: true, message: 'Toutes les données ont été importées avec succès' };
    } catch (error) {
        console.error('Erreur import:', error.message);
        return { success: false, error: error.message };
    }
}