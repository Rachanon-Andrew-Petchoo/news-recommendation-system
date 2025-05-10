// app/api/groupedNews/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";
import { NewsOverview, NewsOverviewWithTopic_DB, NewsGroup } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const db = await pool.getConnection();

    const query = `
      SELECT 
        a.news_id,
        a.title,
        a.description,
        a.url_to_image,
        p.topic
      FROM news_articles a
      JOIN news_profiles p ON a.news_id = p.news_id
      WHERE (p.topic IS NOT NULL)
    `;
    const [rows] = await db.execute<RowDataPacket[]>(query);
    db.release();

    if (rows.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Group articles by topic
    const groupedMap = new Map<string, NewsOverview[]>();

    for (const row of rows as NewsOverviewWithTopic_DB[]) {
      const { topic, ...article } = row;
      if (!groupedMap.has(topic)) {
        groupedMap.set(topic, []);
      }
      groupedMap.get(topic)!.push(article);
    }

    // Format the result for the UI
    const result: NewsGroup[] = Array.from(groupedMap.entries()).map(
      ([topic, news]) => ({
        topic,
        news,
      })
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching grouped news:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
