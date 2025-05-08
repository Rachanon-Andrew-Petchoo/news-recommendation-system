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

export interface NewsOverviewWithProbEmbedding_DB extends NewsOverview {
    prob_embedding: number[];
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

export interface UserInteractionWithNewsInfo_DB {
  news_id: number;
  rating: number | null; // Explicit feedback - User Rating
  time_spent_seconds: number; // Implicit feedback
  viewed_at: Date; // Calculating recency with this parameter
  prob_embedding: number[]; // Article embedding vector
  content_length: number; // Document length for normalization
}
