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

  describe('parseUrl', () => {
    it('returns the components of a url', () => {
      expect(
        site.parseUrl('http://www.mangahere.cc/manga/urami_koi_koi_urami_koi/'),
      ).toEqual({ seriesSlug: 'urami_koi_koi_urami_koi', chapterSlug: null });

      expect(
        site.parseUrl('http://www.mangahere.cc/manga/urami_koi_koi_urami_koi/c038/1.html'),
      ).toEqual({ seriesSlug: 'urami_koi_koi_urami_koi', chapterSlug: 'c038' });

      expect(
        site.parseUrl('http://www.mangahere.cc/manga/flying_witch_ishizuka_chihiro/c018.5/'),
      ).toEqual({ seriesSlug: 'flying_witch_ishizuka_chihiro', chapterSlug: 'c018.5'});
    });

    it('throws on unparseable paths', () => {
      expect(() => {
        site.parseUrl('http://www.mangahere.cc/banana');
      }).toThrow('Could not parse url');

      expect(() => {
        site.parseUrl('http://www.mangahere.cc/marnga/hello/world');
      }).toThrow('Could not parse url');
    });
  });

  describe('getSeries', () => {
    it('returns a metadata object', async () => {
      const metadata = await site.getSeries('urami_koi_koi_urami_koi');

      expect(metadata).toEqual({
        id: '1871827808',
        slug: 'urami_koi_koi_urami_koi',
        url: 'http://mangahere.cc/manga/urami_koi_koi_urami_koi',
        title: 'Urami Koi, Koi, Urami Koi.',
        chapters: expect.arrayContaining([
          {
            id: '1886471882',
            url: 'http://mangahere.cc/manga/urami_koi_koi_urami_koi/c013',
            slug: 'c013',
            number: '13',
            createdAt: 1449993600,
          }
        ]),
        updatedAt: expect.any(Number),
      });
    });
  });

  describe('getChapter', () => {
    it('returns a list of pages', async () => {
      const chapter = await site.getChapter('urami_koi_koi_urami_koi', 'c038');

      expect(chapter.id).toEqual('1802289597');
      expect(chapter.url).toEqual('http://mangahere.cc/manga/urami_koi_koi_urami_koi/c038');
      expect(chapter.pages).toHaveLength(27);
      expect(chapter.pages[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          url: expect.stringContaining('http'),
        }),
      );
    }, 30000);
  })
});
