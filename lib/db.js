import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync';

if (process.env.NOW !== 'true') {
  require('dotenv').config();
}

console.log(process.env.MONGO_URL);

const adapter = new FileSync('.data/db.json');
const db = low(adapter);

db._.mixin(require('lodash-id'));
db.defaults({ collections: [] }).write();

export default db;
