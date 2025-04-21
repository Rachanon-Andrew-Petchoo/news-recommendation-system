export interface TestCount {
    count: number
  }

  export interface NewsArticle  {
    news_id: number;
    content: string;
    image_url?: string | null; 
    news_embedding: number[];
    created_at: string; 
    updated_at: string; 
  }