// components/NewsCards.tsx
'use client';
import Link from 'next/link';
import { NewsOverview } from '@/types';

interface NewsCardsProps {
  articles: NewsOverview[];
}

export default function NewsCards({ articles }: NewsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((news) => (
        <Link
          href={`/news/${news.news_id}`}
          key={news.news_id}
          className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition duration-300 bg-white"
        >
          <img
            src={news.url_to_image}
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
  );
}
