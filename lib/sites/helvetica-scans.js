// Series URLs
// http://helveticascans.com/r/series/talentless-nana/
// http://helveticascans.com/r/series/moussou-telepathy/

// Reader URLs
// http://helveticascans.com/r/read/<manga-slug>/<lang>/<volume-id>/<chapter-id>/page/<page-id>
// http://helveticascans.com/r/read/talentless-nana/en/2/11/page/1
// http://helveticascans.com/r/read/mousou-telepathy/en/0/499/page/1

const { getPageHtml } = require('../utils');

exports.getSeries = async function getSeries(seriesSlug, lang) {
}

exports.getChapterImages = async function getChapterImages (seriesSlug, lang, volumeId, chapterId) {
  const url = `http://helveticascans.com/r/read/`
}