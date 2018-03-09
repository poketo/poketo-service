import site from './mangakakalot';

describe('MangakakalotAdapter', () => {
  describe('supportsUrl', () => {});

  describe('parseUrl', () => {
    it('returns the components of a url', () => {
      expect(
        site.parseUrl('http://mangakakalot.com/manga/urami_koi_koi_urami_koi/'),
      ).toEqual({ seriesSlug: 'urami_koi_koi_urami_koi', chapterSlug: null });

      expect(
        site.parseUrl('http://mangakakalot.com/chapter/urami_koi_koi_urami_koi/chapter_15.2'),
      ).toEqual({ seriesSlug: 'urami_koi_koi_urami_koi', chapterSlug: 'chapter_15.2' });
    });

    it('throws on unparseable urls', () => {
      expect(() => {
        site.parseUrl('https://www.mangaupdates.com/authors.html?id=462621');
      }).toThrow('Could not parse url');
    });
  });

  describe('getSeries', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeries('urami_koi_koi_urami_koi');

      expect(metadata).toEqual({
        id: '663539622',
        slug: 'urami_koi_koi_urami_koi',
        url: 'http://mangakakalot.com/manga/urami_koi_koi_urami_koi',
        title: 'Urami Koi, Koi, Urami Koi.',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getChapter('urami_koi_koi_urami_koi', 'chapter_5');

      expect(chapter.id).toEqual('668379898');
      expect(chapter.url).toEqual('http://mangakakalot.com/chapter/urami_koi_koi_urami_koi/chapter_5');
      expect(chapter.pages).toHaveLength(48);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          url: expect.stringContaining('http'),
        }),
      );
    });
  });
});
