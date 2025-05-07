export interface TestCount {
    count: number
  }

export interface NewsOverview {
    news_id: number;
    title: string;
    description?: string;
    url_to_image?: string;
  };

export interface NewsOverviewWithTopic_DB extends NewsOverview {
    topic: string;
  }

export interface NewsGroup {
    topic: string;
    news: NewsOverview[];
  };

export interface NewsArticle extends NewsOverview {
  author?: string;
  url: string;
  published_at?: string;
}
