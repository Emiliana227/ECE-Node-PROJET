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
    console.log("Collections prêtes à l'emploi");
})();

app.listen(3000, () => console.log("API disponible sur http://localhost:3000"));