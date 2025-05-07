'use client';
import { NewsArticle } from '@/types';
import NewsCards from '../components/NewsCard';

const mockRecommendedNews: NewsArticle[] = [
  { 
    news_id: 1, 
    title: 'Bitcoin in the bush - the crypto mine in remote Zambia', 
    description: 'Bitcoin miners will go to remote locations to take advantage of cheap electricity.', 
    url_to_image: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 2, 
    title: 'Ethereum’s energy consumption drops dramatically', 
    description: 'A revolutionary shift to proof-of-stake reduces energy demands significantly.',
    url_to_image: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 3, 
    title: 'AI and the Future of Work', 
    description: 'How artificial intelligence is reshaping the job market and workplace dynamics.',
    url_to_image: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 4, 
    title: 'AI and the Future of Work', 
    description: 'How artificial intelligence is reshaping the job market and workplace dynamics.',
    url_to_image: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 5, 
    title: 'AI and the Future of Work', 
    description: 'How artificial intelligence is reshaping the job market and workplace dynamics.',
    url_to_image: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
];

export default function RecommendedNewsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recommended News</h2>

      {/* News Cards */}
      <NewsCards articles={mockRecommendedNews} />

    </div>
  );
}
