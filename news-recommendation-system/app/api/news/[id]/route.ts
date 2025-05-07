import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";

export async function GET(
    request: NextRequest, 
    { params }: { params: { id: string } }
) {
  const { id } = await params
  const newsId = parseInt(id);

  if (isNaN(newsId)) {
    return NextResponse.json({ error: "Invalid news ID: not a number" }, { status: 400 });
  }

  try {
    const db = await pool.getConnection();

    const query = `
      SELECT 
        news_id,
        author,
        title,
        description,
        url,
        url_to_image,
        published_at
      FROM news_articles
      WHERE news_id = ?
    `;

    const [rows] = await db.execute<RowDataPacket[]>(query, [newsId]);
    db.release();

    if (rows.length === 0) {
      return NextResponse.json({ error: "News article not found" }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error fetching news article:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
