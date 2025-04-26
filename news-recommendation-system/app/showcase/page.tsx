'use client';
import Link from 'next/link';
import { useState } from 'react';

const commonImageUrl =
  'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg';

const mockTopics = [
  {
    topic: 'Technology',
    news: [
      {
        news_id: 1,
        title: 'The Future of AI in 2025',
        description: 'Experts weigh in on how AI might shape society in the coming years.',
        urlToImage: commonImageUrl,
      },
      {
        news_id: 2,
        title: 'Quantum Computing Breakthrough',
        description: 'A major leap in quantum error correction could change the game.',
        urlToImage: commonImageUrl,
      },
    ],
  },
  {
    topic: 'Environment',
    news: [
      {
        news_id: 3,
        title: 'Climate Change Effects in the Arctic',
        description: 'Melting glaciers are leading to dramatic environmental changes.',
        urlToImage: commonImageUrl,
      },
    ],
  },
];

export default function ShowcasePage() {
  const [selectedTopic, setSelectedTopic] = useState(mockTopics[0].topic);
  const selectedNews = mockTopics.find((t) => t.topic === selectedTopic)?.news || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">News Showcase</h2>

      {/* Topic Selector */}
      <div className="flex flex-wrap gap-2">
        {mockTopics.map((t) => (
          <button
            key={t.topic}
            onClick={() => setSelectedTopic(t.topic)}
            className={`px-4 py-2 rounded-full border ${
              t.topic === selectedTopic ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border-blue-600'
            }`}
          >
            {t.topic}
          </button>
        ))}
      </div>

      {/* News Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedNews.map((news) => (
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
