'use client';
import Link from 'next/link';

const mockRecommendedNews = [
  { 
    news_id: 1, 
    title: 'Bitcoin in the bush - the crypto mine in remote Zambia', 
    description: 'Bitcoin miners will go to remote locations to take advantage of cheap electricity.', 
    urlToImage: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 2, 
    title: 'Ethereum’s energy consumption drops dramatically', 
    description: 'A revolutionary shift to proof-of-stake reduces energy demands significantly.',
    urlToImage: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 3, 
    title: 'AI and the Future of Work', 
    description: 'How artificial intelligence is reshaping the job market and workplace dynamics.',
    urlToImage: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 4, 
    title: 'AI and the Future of Work', 
    description: 'How artificial intelligence is reshaping the job market and workplace dynamics.',
    urlToImage: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  { 
    news_id: 5, 
    title: 'AI and the Future of Work', 
    description: 'How artificial intelligence is reshaping the job market and workplace dynamics.',
    urlToImage: 'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg' 
  },
  // Add more mock data as needed
];

export default function RecommendedNewsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recommended News</h2>

      {/* News Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRecommendedNews.map((news) => (
          <Link
            href={`/news/${news.news_id}`}
            key={news.news_id}
            className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition duration-300 bg-white"
          >
            <img
              src={news.urlToImage}
              alt={news.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-semibold">{news.title}</h3>
              <p className="text-sm text-gray-600">{news.description}</p>
              <Link
                href={`/news/${news.news_id}`}
                className="text-blue-600 hover:text-blue-800 transition"
              >
                Read More
              </Link>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
