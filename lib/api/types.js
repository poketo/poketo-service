// @flow

export opaque type SiteId: string = string;
export opaque type SeriesId: string = string;
export opaque type ChapterId: string = string;

export const toSiteId = (id: string): SiteId => id;
export const toSeriesId = (id: string): SeriesId => id;
export const toChapterId = (id: string): ChapterId => id;

export type PageDimensions = {
  width: number,
  height: number,
};

export type Page = {
  id: string,
  url: string,
  width?: number,
  height?: number,
};

export type Chapter = {
  id: ChapterId,
  slug: string,
  url: string,
  seriesId: string,
  pages: Array<Page>,
};

export type ChapterPreview = {
  id: ChapterId,
  slug: string,
  createdAt: number,
};

export type Series = {
  id: SeriesId,
  slug: string,
  url: string,
  title: string,
  chapters?: Array<ChapterPreview>,
  updatedAt: number,
};

export type SiteAdapter = {
  id: SiteId,
  name: string,
  constructUrl: (seriesSlug: string, chapterSlug: string) => string,
  supportsUrl: (url: string) => boolean,
  supportsReading: () => boolean,
  parseUrl: (url: string) => { seriesSlug: string, chapterSlug: string | null },
  getSeries: (seriesSlug: string) => Promise<Series>,
  getChapter: (seriesSlug: string, chapterSlug: string) => Promise<Chapter>,
};
