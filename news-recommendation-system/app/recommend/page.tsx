'use client';

import { useEffect, useState } from 'react';
import { NewsOverview } from '@/types';
import NewsCards from '../components/NewsCard';
import { CircularProgress, Alert, AlertTitle } from '@mui/material';

// Adjustable Parameters
const LIMIT = 10; // number of recommendations to fetch
const RECALCULATE_PROFILE = true; // whether to recalculate the user's profile before getting recommendations

export default function RecommendedNewsPage() {
  const [articles, setArticles] = useState<NewsOverview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const query = new URLSearchParams({
          limit: LIMIT.toString(),
          recalculateProfile: RECALCULATE_PROFILE.toString(),
        }).toString();

        const response = await fetch(`/api/recommendations?${query}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch /api/recommendations`);
        }
        const data: NewsOverview[] = await response.json();

        setArticles(data);
      } catch (err: any) {
        setError('Error fetching recommendations: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Recommended News</h2>

      {/* Show loading spinner if data is still loading */}
      {loading && (
        <div className="flex justify-center items-center space-x-4 py-8">
          <CircularProgress color="primary" />
          <p className="text-lg text-gray-600">Loading Recommendations...</p>
        </div>
      )}

      {/* Show error message if there was an error fetching data */}
      {!loading && error && (
        <Alert severity="error" className="my-4">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {/* News Cards */}
      {!loading && !error && (
        <NewsCards articles={articles} />
      )}
    </div>
  );
}
