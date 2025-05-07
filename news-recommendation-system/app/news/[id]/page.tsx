'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CircularProgress, Alert, AlertTitle, Rating } from '@mui/material';
import { NewsArticle } from '@/types';

export default function NewsArticlePage() {
  const { id } = useParams();

  const [news, setNews] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/news/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch /api/news/[id]');
        }
        const data: NewsArticle = await response.json();

        setNews(data);
      } catch (err: any) {
        setError('Error fetching news: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [id]);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRatingChange = (_event: any, newValue: number | null) => {
    setRating(newValue);
    // You can also send this to your backend here
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-4 pb-8">
      {/* Show loading spinner if data is still loading */}
      {loading && (
        <div className="flex justify-center items-center space-x-4 py-8">
          <CircularProgress color="primary" />
          <p className="text-lg text-gray-600">Loading article...</p>
        </div>
      )}

      {/* Show error message if there was an error fetching data */}
      {!loading && error && (
        <Alert severity="error" className="my-4">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {!loading && !error && news && (
        <>
          <h1 className="text-2xl font-semibold text-gray-900">{news.title}</h1>
          {/* Author and Time Spent on Same Line */}
          <div className="flex justify-between items-center text-sm text-gray-500">
            <p>
              {news.author ? `By ${news.author}` : 'Unknown Author'} •{' '}
              {news.published_at ?
                new Date(news.published_at).toLocaleString()
                : 'Unknown publish date'
              }
            </p>
            <p>
              Time spent: <strong>{timeSpent} seconds</strong>
            </p>
          </div>

          {news.url_to_image && (
            <img
              src={news.url_to_image}
              alt={news.title}
              className="w-full max-h-[300px] object-cover rounded-lg shadow-sm"
            />
          )}

          <div className="text-lg text-gray-700">
            {news.description || 'No description available.'}
          </div>

          {/* Full Article Fallback + Iframe */}
          <div className="pt-6 space-y-2">
            <h2 className="text-lg font-semibold text-gray-800">Full Article</h2>

            <p className="text-sm text-gray-600">
              You can view the full article on the publisher’s website:
            </p>
            <a
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Open Full Article
            </a>

            <div className="flex items-start gap-4 pt-4">
              {/* Fallback module */}
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-2">
                  or view it directly here (if the site allows it):
                </p>
                <iframe
                  src={news.url}
                  className="w-full h-[500px] border rounded-lg shadow-sm"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>

              {/* Star Rating */}
              <div className="flex flex-col items-center justify-start space-y-1 pt-4 pl-4 flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-800">Rate this article</h2>
                <Rating
                  name="article-rating"
                  size="large"
                  value={rating}
                  onChange={handleRatingChange}
                />
                {rating && (
                  <p className="text-sm text-green-600">
                    You rated this {rating} star{rating > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
