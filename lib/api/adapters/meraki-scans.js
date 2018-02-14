// @flow

// Series URLs
// http://merakiscans.com/senryu-girl/
// http://merakiscans.com/ninja-shinobu-san-no-junjou/

// Reader URLs
//

// Uses GlossyBright WordPress plugin / theme.

import cheerio from 'cheerio';
import moment from 'moment-timezone';
import utils from '../utils';

import type { SiteAdapter, ChapterPreview } from '../types';

const MerakiScansAdapter: SiteAdapter = {
  supportsUrl(url) {
    return utils.compareDomain(url, 'http://merakiscans.com/');
  },

  supportsReading () {
    return true;
  },

  async getSeriesMetadata(seriesId) {
    const rss = await utils.getPage(`http://merakiscans.com/manga-rss/${seriesId}`);

    console.log(rss);

    const slug = 'TBD';
    const title = 'TBD';
    const chapters: Array<ChapterPreview> = [];
    const updatedAt = 5;

    return { slug, title, chapters, updatedAt };
  },

  async getSeriesChapter(seriesId, chapterId) {
    const html = await utils.getPage(`http://merakiscans.com/${seriesId}/${chapterId}`);
    const dom = cheerio.load(html);
    const images = dom('img', '#longWrap').map((i, el) => {
      return dom(el).attr('src');
    }).get();

    const pages = images.map((image, i) => ({
      id: i,
      url: image,
    }));

    return { id: chapterId, seriesId, pages };
  },
};

export default MerakiScansAdapter;
