import express from "express";
import { connect } from "./db/mongoClient.js";

const app = express();
app.use(express.json());

let projets;
let taches;
let users;

app.locals.startup = (async () => {
    const db = await connect();
    projets = db.collection("projets");
    taches = db.collection("taches");
    users = db.collection("users");
})();
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
    const user = await users.find(filter).skip(skip).limit(parseInt(limit)).toArray();
    const total = await users.countDocuments(filter);
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




app.listen(3000, () => console.log("API disponible sur http://localhost:3000"));