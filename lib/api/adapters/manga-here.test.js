import site from './manga-here';

describe('MangaHereAdapter', () => {
  describe('supportsUrl', () => {
    it('returns true for urls like mangahere.cc', () => {
      expect(site.supportsUrl('http://www.mangahere.cc'));
      expect(site.supportsUrl('http://www.mangahere.co'));
      expect(site.supportsUrl('https://mangahere.cc'));
    });

    it('returns false for urls that are not mangahere.cc', () => {
      expect(site.supportsUrl('http://www.mangahere.com'));
      expect(site.supportsUrl('http://ma.ngahere.co'));
    });
  });

  describe('getSeriesMetadata', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeriesMetadata('urami_koi_koi_urami_koi');

      expect(metadata).toEqual({
        id: '2002336076',
        slug: 'urami_koi_koi_urami_koi',
        title: 'Urami Koi, Koi, Urami Koi.',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getSeriesChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getSeriesChapter('urami_koi_koi_urami_koi', 'c038');

      expect(chapter.id).toEqual('2691155107');
      expect(chapter.sourceUrl).toEqual('http://m.mangahere.cc/manga/urami_koi_koi_urami_koi/c038/');
      expect(chapter.pages).toHaveLength(27);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          // width: expect.any(Number),
          // height: expect.any(Number),
          id: expect.any(String),
          url: expect.stringContaining('http'),
        }),
      );
    }, 30000);
  })
});
