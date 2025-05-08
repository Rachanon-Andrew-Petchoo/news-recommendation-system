'use client';
import { useEffect, useState } from 'react';
import { NewsGroup } from '@/types';
import NewsCards from '../components/NewsCard';
import { CircularProgress, Alert, AlertTitle } from '@mui/material';

export default function ShowcasePage() {
  const [newsGroups, setNewsGroups] = useState<NewsGroup[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch grouped news data from API
  useEffect(() => {
    const fetchGroupedNews = async () => {
      try {
        const response = await fetch('/api/groupedNews');
        if (!response.ok) {
          throw new Error("Failed to fetch /api/groupedNews");
        }
        const data: NewsGroup[] = await response.json();

        setNewsGroups(data);
        if (data.length > 0) {
          setSelectedTopic(data[0].topic); // Set the first topic by default
        }
      } catch (err: any) {
        setError('Error fetching news: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupedNews();
  }, []); // Empty dependency array means it will run once when the component mounts

  // Find the selected news group
  const selectedNews = newsGroups.find((group) => group.topic === selectedTopic)?.news || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">News Showcase</h2>

      {/* Show loading spinner if data is still loading */}
      {loading && (
        <div className="flex justify-center items-center space-x-4 py-8">
          <CircularProgress color="primary" />
          <p className="text-lg text-gray-600">Loading News...</p>
        </div>
      )}

      {/* Show error message if there was an error fetching data */}
      {!loading && error && (
        <Alert severity="error" className="my-4">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          {/* Topic Selector */}
          <div className="flex flex-wrap gap-2">
            {newsGroups.map((t) => (
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
        </>
      )}

      
    </div>
  );
}
