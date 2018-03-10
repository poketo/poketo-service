import { Database, Model } from 'mongorito';
export { ObjectId } from 'mongorito';

if (process.env.MONGO_URL === undefined && process.env.NOW !== 'true') {
  require('dotenv').config();
}

const db = new Database(process.env.MONGO_URL);

export class Collection extends Model {};

db.register(Collection);
db.connect();

export default db;
