// @flow

export type Page = {
  id: string,
  width: number,
  height: number,
  src: string,
};

export type Chapter = {
  id: string,
  seriesId: string,
  pages: Array<Page>,
};

export type ChapterPreview = {
  id: string,
  createdAt: number,
};

export type Series = {
  slug: string,
  title: string,
  chapters?: Array<ChapterPreview>,
  updatedAt: number,
};

export type SiteAdapter = {
  supportsUrl: (url: string) => boolean,
  supportsReading: () => boolean,
  getSeriesMetadata: (slug: string) => Promise<Series>,
  getSeriesChapter: (seriesId: string, chapterId: string) => Promise<Chapter>,
};
