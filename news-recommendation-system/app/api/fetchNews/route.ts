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




// Bertopic 
function Topic_prediction(content: string[], embeddingArray: number[][]): Promise<number[]> {
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
  const contents = rows.map(r => r.content);

  const embeddings = rows.map(r => r.llm_embedding);
  console.log(embeddings[0]);
  console.log('embeddingArray gatheres');
  // call your analysis function
  const resultsList = await Topic_prediction(contents, embeddings);
  console.log('prediction done');

  const updateSql = `
      UPDATE news_profiles
         SET prob_embedding = ?, updated_at = NOW()
       WHERE news_id = ?;
    `;
    for (let i = 0; i < rows.length; i++) {
      const newsId = rows[i].news_id;
      const result = resultsList[i];
      await db.execute<ResultSetHeader>(updateSql, [
        JSON.stringify(result),
        newsId
      ]);

  }
  return;
}



// Fetch all the content from the News API
export async function fetchAndStoreNews() {
  const newsAPI = new NewsAPI(process.env.NEWS_API_KEY!);
    
  // fetch top headlines

  const response = await newsAPI.getTopHeadlines({
      country: 'us',
    });
  // extend news articles to the database
  //const response = await newsAPI.getEverything({q: 'politics', language: 'en', from : '2025-04-26', to: '2025-04-28'});
  
  const articles = response.articles || [];
  if (articles.length === 0) {
    console.log('No headlines found.');
    return;
  }
  console.log('called the news api');
  var count = 0;
  for (const item of articles) {
    count += 1;
    if (count === 2) break;
    if (!item.url) continue;

    // download the full article HTML
    // Reference website: https://newsapi.org/docs/guides/how-to-get-the-full-content-for-a-news-article
    try {
      const htmlRes = await axios.get(item.url, { responseType: 'text' });
      const dom = new JSDOM(htmlRes.data, { url: item.url });

      const parsed = new Readability(dom.window.document).parse();
      const fullContent = parsed?.textContent?.trim()
        ?? [item.title, item.description].filter(Boolean).join('\n\n');

      // embed the content
      const news_embedding = await llm_embedText(fullContent);

      // output items
      const author = item.author;
      const source_name = item.source.name;
      const source_id = item.source.id;
      const title = item.title;
      const description = item.description;
      const url = item.url;
      const publishedAt = item.publishedAt;
      const image_url = item.urlToImage ?? null;
      const now = new Date().toISOString();
      

      const [res] = await pool.execute<import('mysql2').ResultSetHeader>(
        `
        INSERT INTO news_articles
          (source_id, source_name, author, title, description, url, published_at, content, url_to_image, created_at, updated_at)
        VALUES
          (?,?,?, ?, ?, ?, ?, ?, ?, ?, ?);
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
          image_url,
          now,
          now
        ]
      );
      const newsId = res.insertId;
      console.log('done fetch news, start embedding');
      await pool.execute<import('mysql2').ResultSetHeader>(
        `
        INSERT INTO news_profiles
          (news_id, llm_embedding, updated_at)
        VALUES
          (?, ?, ?)
        `,
        [
          newsId,
          JSON.stringify(news_embedding),
          now,
        ]
      );
      console.log('✔ Inserted article:', item.title);
    }
    catch(error) {
      console.log('Error fetching article:', item.title, error);
      continue;
    }
  }
  return;
}

export async function GET(request: NextRequest) {
  await fetchAndStoreNews()
  /***
   * Calling bertopic for prob distributions of all articles
   */

  console.log('call the berttopic');
  await prob_embed();

  return NextResponse.json({ message: 'Done' });

}