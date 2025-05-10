import { NextRequest, NextResponse } from "next/server";

import NewsAPI from 'ts-newsapi';
// and we need jsdom and Readability to parse the article HTML
import axios from 'axios';
import { JSDOM } from 'jsdom';  
import { Readability } from '@mozilla/readability';
import { execFile } from 'child_process';
import { RowDataPacket, ResultSetHeader } from "mysql2";
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

function llm_embedText(content: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const child = execFile('python3', ['embed.py', 'content_embedding'], (err, stdout, stderr) => {
      if (err) return reject(err);
      try {
        const emb = JSON.parse(stdout);
        resolve(emb);
      } catch (e) {
        reject(new Error(`embed.py output not JSON: ${e}\nGot: ${stdout}`));
      }
    });
    if (!child.stdin) {
      return reject(new Error('Failed to open stdin of embed.py process'));
    }
    child.stdin.write(JSON.stringify({ content }));
    child.stdin.end();
  });
}

// BERTopic 
function topic_prediction(content: string[], embeddingArray: number[][]): Promise<[string, number[]][]> {
  return new Promise((resolve, reject) => {
    const child = execFile('python3', ['embed.py', 'prob_embedding'], (err, stdout, stderr) => {
      if (err) return reject(err);
      try {
        const emb = JSON.parse(stdout);
        resolve(emb);
      } catch (e) {
        reject(new Error(`topic.py output not JSON: ${e}\nGot: ${stdout}`));
      }
    });
    if (!child.stdin) {
      return reject(new Error('Failed to open stdin of topic.py process'));
    }
    child.stdin.write(JSON.stringify({ content, embeddingArray, useGpt: true }));
    child.stdin.end();
  });
}

export async function prob_embed() {
  console.log('Updating prob_embedding of whole DB with BERTopic');

  // Fetch all articles and their embeddings
  console.log('Getting all articles from DB');
  const db = await pool.getConnection();
  const query = `
  SELECT
    a.news_id,
    a.content,
    np.llm_embedding
  FROM news_articles AS a
  JOIN news_profiles AS np
    ON a.news_id = np.news_id
  `;
  const [rows] = await db.execute<RowDataPacket[]>(query);

  // Call BERTopic to get prob_embedding
  console.log('Calling BERTopic...');
  const contents = rows.map(r => r.content);
  const embeddings = rows.map(r => r.llm_embedding);

  const resultsList = (await topic_prediction(contents, embeddings));
  console.log('BERTopic completed');

  // Save articles' prob_embedding to DB
  console.log("Saving article's BERTopic embedding...");
  const casesTopic: string[] = [];
  const casesProb: string[] = [];
  const ids: number[] = [];

  for (let i = 0; i < rows.length; i++) {
    const newsId = rows[i].news_id;
    const [topic, probEmbedding] = resultsList[i];

    ids.push(newsId);
    casesTopic.push(`WHEN ${newsId} THEN ${db.escape(topic)}`);
    casesProb.push(`WHEN ${newsId} THEN ${db.escape(JSON.stringify(probEmbedding))}`);
  }

  const updateQuery = `
    UPDATE news_profiles
       SET topic = CASE news_id ${casesTopic.join(' ')} END,
           prob_embedding = CASE news_id ${casesProb.join(' ')} END
     WHERE news_id IN (${ids.join(',')});
  `;

  await db.execute(updateQuery);
  db.release();
  
  console.log("✔ Completed: saving articles' BERTopic embedding...");
    
  return;
}

// Helper to timeout a promise
function withTimeout<T>(promise: Promise<T>, ms: number, label = ""): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms ${label && `(${label})`}`)), ms)
    ),
  ])
}

// Fetch articles from the News API + Calculate llm_embedding
export async function fetchAndStoreNews() {
  const newsAPI = new NewsAPI(process.env.NEWS_API_KEY!);
    
  console.log('Calling the news api');
  // fetch top headlines
  const response = await newsAPI.getTopHeadlines({
      country: 'us',
    });
  // extend news articles to the database
  //const response = await newsAPI.getEverything({q: 'politics', language: 'en', from : '2025-04-26', to: '2025-04-28'});
  
  const articles = response.articles || [];
  if (articles.length === 0) {
    console.log('No articles found.');
    return;
  }
  console.log('Finished fetching from the news api');

  // Filtered out articles already existed on DB
  const [existingRows] = await pool.execute<import('mysql2').RowDataPacket[]>(
    `SELECT url FROM news_articles`
  );
  const existingUrls = new Set(existingRows.map((row: any) => row.url));
  const newArticles = articles.filter((item) => item.url && !existingUrls.has(item.url));
  console.log(`Fetched ${articles.length} articles, ${newArticles.length} are new.`);

  for (const item of newArticles) {
    if (!item.url) continue;

    try {
      console.log('Downloading article:', item.url.trim());
      // Download the full article HTML
      // Reference website: https://newsapi.org/docs/guides/how-to-get-the-full-content-for-a-news-article
      const htmlRes = await withTimeout(
        axios.get(item.url.trim(), { responseType: 'text' }),
        10_000,
        "HTML download"
      );
      const dom = new JSDOM(htmlRes.data, { url: item.url });
      const parsed = new Readability(dom.window.document).parse();
      const fullContent = parsed?.textContent?.trim()
        ?? [item.title, item.description].filter(Boolean).join('\n\n');

      // Embed the content into LLM embeddings
      const news_embedding = await llm_embedText(fullContent);

      // Write article to news_articles DB
      console.log('Saving article...');
      const author = item.author;
      const source_name = item.source.name;
      const source_id = item.source.id;
      const title = item.title;
      const description = item.description;
      const url = item.url;
      const publishedAt = item.publishedAt;
      const image_url = item.urlToImage ?? null;
      
      const [res] = await pool.execute<import('mysql2').ResultSetHeader>(
        `
        INSERT INTO news_articles
          (source_id, source_name, author, title, description, url, published_at, content, url_to_image)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?, ?);
        `,
        [
          source_id,
          source_name,
          author,
          title,
          description,
          url,
          publishedAt,
          fullContent,
          image_url
        ]
      );
      const newsId = res.insertId;

      // Write article to news_articles DB
      console.log("Saving article's LLM embedding...");
      await pool.execute<import('mysql2').ResultSetHeader>(
        `
        INSERT INTO news_profiles
          (news_id, llm_embedding)
        VALUES
          (?, ?)
        `,
        [
          newsId,
          JSON.stringify(news_embedding)
        ]
      );

      console.log('✔ Completed article ' + newsId + ': ' + item.title);
    }
    catch(error) {
      console.log('Error processing article: ', item.title, error);
      continue;
    }
  }
  return;
}

export async function GET(request: NextRequest) {
  await fetchAndStoreNews()
  
  await prob_embed();

  return NextResponse.json({ message: 'success' });

}