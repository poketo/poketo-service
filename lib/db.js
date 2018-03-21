import { Database, Model } from 'mongorito';
import utils from './utils';

if (process.env.MONGO_URL === undefined && process.env.NOW !== 'true') {
  require('dotenv').config();
}

const db = new Database(process.env.MONGO_URL);

export class Collection extends Model {};

const extendCollection = Collection => {
  Collection.prototype.addBookmark = function (series, linkToUrl = null, lastReadAt = 0) {
    const bookmarks = this.get('bookmarks');

    const existingBookmark = bookmarks.find(bookmark => {
      const sameSeries = bookmark.id === series.id;
      const sameLinkToUrl =
        (utils.isNil(bookmark.linkToUrl) && utils.isNil(linkToUrl))
        || utils.compareUrl(bookmark.linkToUrl, linkToUrl);

      return sameSeries && sameLinkToUrl;
    });

    if (existingBookmark) {
      throw new Error(`A bookmark for ${series.url} already exists!`);
    }

    const bookmark = { id: series.id, url: series.url, lastReadAt };

    if (linkToUrl) {
      bookmark.linkToUrl = linkToUrl;
    }

    const newBookmarks = [...bookmarks, bookmark];

    this.set('bookmarks', newBookmarks);
  }
};

Collection.use(extendCollection);

db.register(Collection);
db.connect();

export default db;
export { ObjectId } from 'mongorito';
