// @flow

import { Database, Model } from 'mongorito';
import utils from './utils';

import type { Series } from './types';

if (process.env.MONGO_URL === undefined && process.env.NOW !== 'true') {
  require('dotenv').config();
}

const db = new Database(process.env.MONGO_URL);

export class Collection extends Model {};

const extendCollection = Collection => {
  Collection.prototype.addBookmark = function (series: Series, linkToUrl: ?string, lastReadAt: ?number) {
    const bookmarks = this.get('bookmarks');

    const existingBookmark = bookmarks.find(bookmark => bookmark.id === series.id);

    if (existingBookmark) {
      throw new Error(`A bookmark for ${series.url} already exists!`);
    }

    const bookmark: Object = {
      id: series.id,
      url: series.url,
      lastReadAt,
    };

    if (linkToUrl) {
      bookmark.linkTo = linkToUrl;
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
