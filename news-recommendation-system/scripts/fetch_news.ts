import NewsAPI from 'ts-newsapi';
// and we need jsdom and Readability to parse the article HTML
import axios from 'axios';
import { JSDOM } from 'jsdom';  
import { Readability } from '@mozilla/readability';
import { spawn } from 'child_process';

import pool from "@/libs/mysql";



/***  NEWSAPI other methods that might be helpful
    * other parameters: might be helpful: q, category, sources,

    * get sources (limited items)
    * const topHeadlines = await newsAPI.sources({});

    * Search through millions of articles from over 50,000 large and small news sources and blogs.
    * const headlines = await newsAPI.getEverything({});
    * 
***/

// pass the text to the Python script
// and get the embedding back
function embedText(text: string): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const py = spawn('python3', ['embed.py']);
      let output = '';
      py.stdout.on('data', d => output += d);
      py.stderr.on('data', d => console.error(d.toString()));
      py.on('close', () => {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(e);
        }
      });
      py.stdin.write(text);
      py.stdin.end();
    });
  }

// Fetch all the content from the News API
async function fetchAndStoreNews() {
    const newsAPI = new NewsAPI(process.env.NEWS_API_KEY!);
  
    // fetch top headlines
    const response = await newsAPI.getTopHeadlines({
      country: 'us',
    });

    const articles = response.articles || [];
    if (articles.length === 0) {
      console.log('No headlines found.');
      return;
    }

    for (const item of articles) {
        if (!item.url) continue;
  
        // download the full article HTML
        // Reference website: https://newsapi.org/docs/guides/how-to-get-the-full-content-for-a-news-article
        const htmlRes = await axios.get(item.url, { responseType: 'text' });
        const dom = new JSDOM(htmlRes.data, { url: item.url });
  
        const parsed = new Readability(dom.window.document).parse();
        const fullContent = parsed?.textContent?.trim()
          ?? [item.title, item.description].filter(Boolean).join('\n\n');

        // embed the content
        const news_embedding = await embedText(fullContent);
  
        // output items
        const image_url = item.urlToImage ?? null;
        const now = new Date().toISOString();
  
        // Insert into table
        await pool.execute<import('mysql2').ResultSetHeader>(
            `
            INSERT INTO news_articles
              (content, image_url, news_embedding, created_at, updated_at)
            VALUES
              (?, ?, ?, ?, ?)
            `,
            [
              fullContent,
              image_url,
              JSON.stringify(news_embedding),
              now,
              now
            ]
          );
  
          console.log('✔ Inserted article:', item.title);
          break; // for testing with one article remove this line after testing
    
    } 
}

  
fetchAndStoreNews().catch(err => {
    console.error('Error fetching/storing news:', err);
    process.exit(1);
});
