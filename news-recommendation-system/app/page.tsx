'use client'

import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans text-gray-800">
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 py-20">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6">
          Welcome to NewsReel 📣
        </h1>
        <p className="text-lg sm:text-xl max-w-xl text-gray-600 mb-10">
          Get personalized news recommendations powered by semantic understanding. 
          Dive into your interests or browse today’s highlights.
        </p>
        <div className="flex gap-4">
          <Link
            href="/recommend"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            View Recommendations
          </Link>
          <Link
            href="/showcase"
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-50 transition"
          >
            Explore Showcase
          </Link>
        </div>
      </main>
    </div>
  );
}
