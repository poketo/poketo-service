import site from './mangakakalot';

describe('MangakakalotAdapter', () => {
  describe('supportsUrl', () => {});

  describe('getSeriesMetadata', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeriesMetadata(
        'gleipnir',
      );

      expect(metadata).toEqual({
        slug: 'gleipnir',
        title: 'Gleipnir',
        chapters: expect.any(Array),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getSeriesChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getSeriesChapter('gleipnir', '5');

      expect(chapter.sourceUrl).toEqual('http://mangakakalot.com/chapter/gleipnir/chapter_5');
      expect(chapter.pages).toHaveLength(28);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          url: expect.stringContaining('http'),
        }),
      );
    });
  });
});
