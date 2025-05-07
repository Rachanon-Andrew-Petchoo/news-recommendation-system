export interface TestCount {
    count: number
  }

export interface NewsArticle {
    news_id: number;
    title: string;
    description?: string;
    url_to_image?: string;
  };

export interface NewsGroup {
    topic: string;
    news: NewsArticle[];
  };
