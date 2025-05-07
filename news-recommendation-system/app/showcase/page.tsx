'use client';
import { NewsGroup } from '@/types';
import { useState } from 'react';
import NewsCards from '../components/NewsCard';

const commonImageUrl =
  'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg';

const mockTopics: NewsGroup[] = [
  {
    topic: 'Technology',
    news: [
      {
        news_id: 1,
        title: 'The Future of AI in 2025',
        description: 'Experts weigh in on how AI might shape society in the coming years.',
        url_to_image: commonImageUrl,
      },
      {
        news_id: 2,
        title: 'Quantum Computing Breakthrough',
        description: 'A major leap in quantum error correction could change the game.',
        url_to_image: commonImageUrl,
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
        url_to_image: commonImageUrl,
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
      <NewsCards articles={selectedNews} />
    </div>
  );
}
