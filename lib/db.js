import { Database, Model } from 'mongorito';
import utils from './utils';

if (process.env.MONGO_URL === undefined && process.env.NOW !== 'true') {
  require('dotenv').config();
}

const db = new Database(process.env.MONGO_URL);

export class Collection extends Model {};

const extendCollection = Collection => {
  Collection.prototype.addBookmark = function (id, url, linkToUrl = null, lastReadAt = 0) {
    const bookmarks = this.get('series');

    const existingBookmark = bookmarks.find(b => {
      const sameSeries = b.id === id;
      const sameLinkToUrl =
        (utils.isNil(b.linkToUrl) && utils.isNil(linkToUrl))
        || utils.compareUrl(b.linkToUrl, linkToUrl);

      return sameSeries && sameLinkToUrl;
    });

    if (existingBookmark) {
      throw new Error(`A bookmark for ${url} already exists!`);
    }

    const bookmark = { id, url, lastReadAt };

    if (linkToUrl) {
      bookmark.linkToUrl = linkToUrl;
    }

    const newBookmarks = [...bookmarks, bookmark];

    this.set('series', newBookmarks);
  }
};

Collection.use(extendCollection);

db.register(Collection);
db.connect();

export default db;
export { ObjectId } from 'mongorito';
