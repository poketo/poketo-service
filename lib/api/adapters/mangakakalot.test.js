import site from './mangakakalot';

describe('MangakakalotAdapter', () => {
  describe('supportsUrl', () => {});

  describe('getSeriesMetadata', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeriesMetadata('urami_koi_koi_urami_koi');

      expect(metadata).toEqual({
        id: '4248190390',
        slug: 'urami_koi_koi_urami_koi',
        title: 'Urami Koi, Koi, Urami Koi.',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getSeriesChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getSeriesChapter('urami_koi_koi_urami_koi', '5');

      expect(chapter.id).toEqual('1691448028');
      expect(chapter.sourceUrl).toEqual('http://mangakakalot.com/chapter/urami_koi_koi_urami_koi/chapter_5');
      expect(chapter.pages).toHaveLength(48);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          url: expect.stringContaining('http'),
        }),
      );
    });
  });
});
