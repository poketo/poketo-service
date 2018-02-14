import { Database, Model } from 'mongorito';
export { ObjectId } from 'mongorito';

if (process.env.MONGO_URL === undefined && process.env.NOW !== 'true') {
  require('dotenv').config();
}

const db = new Database(process.env.MONGO_URL);

export class Bookshelf extends Model {};

db.register(Bookshelf);
db.connect();

export default db;
