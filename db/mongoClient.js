import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const client = new MongoClient(process.env.MONGO_URI);
let db = null;
let DB_NAME="GestionnaireProjets";
export async function connect() {
if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log("MongoDB connecté :", db.databaseName);
}
    return db;
}
