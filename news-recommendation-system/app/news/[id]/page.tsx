'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const mockNews = {
  news_id: 1,
  author: 'Joe Tidy',
  title: 'Bitcoin in the bush - the crypto mine in remote Zambia',
  description: 'Bitcoin miners will go to remote locations to take advantage of cheap electricity.',
  url: 'https://en.wikipedia.org/wiki/Bitcoin',
  urlToImage:
    'https://ichef.bbci.co.uk/news/1024/branded_news/583f/live/26541af0-0628-11f0-b773-ddd19e96af91.jpg',
  publishedAt: '2025-03-25T05:53:55Z',
};

export default function NewsDisplayPage() {
  const { newsId } = useParams();
  const [rating, setRating] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRating = (value: number) => {
    setRating(value);
    // Store this in DB later
  };

  const {
    author,
    title,
    description,
    url,
    urlToImage,
    publishedAt,
  } = mockNews;

  return (
    <div className="space-y-4 max-w-4xl mx-auto px-4 pb-8">
      <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
      
      {/* Author and Time Spent on Same Line */}
      <div className="flex justify-between items-center text-sm text-gray-500">
        <p>{author ? `By ${author}` : 'Unknown Author'} •{' '}
          {new Date(publishedAt).toLocaleString()}
        </p>
        {/* Time spent moved up here */}
        <p>Time spent: <strong>{timeSpent} seconds</strong></p>
      </div>

      <img
        src={urlToImage}
        alt={title}
        className="w-full max-h-[300px] object-cover rounded-lg shadow-sm"
      />

      <div className="text-lg text-gray-700">{description}</div>

      {/* Full Article Fallback + Iframe */}
      <div className="pt-6 space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Full Article</h2>

        <p className="text-sm text-gray-600">
          You can view the full article on the publisher’s website:
        </p>
        <a
          href={url}
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
              or read it directly here (if the site allows it):
            </p>
            <iframe
              src={url}
              className="w-full h-[500px] border rounded-lg shadow-sm"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            />
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center justify-start space-y-1 pt-4 pl-4 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">Rate this article</h2>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`cursor-pointer text-2xl transition ${
                    rating && star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => handleRating(star)}
                >
                  ★
                </span>
              ))}
            </div>
            {rating && (
              <p className="text-sm text-green-600">
                You rated this {rating} star{rating > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
