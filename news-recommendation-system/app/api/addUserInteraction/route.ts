import { NextRequest, NextResponse } from 'next/server';
import pool from '@/libs/mysql';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, news_id, time_spent_seconds, rating } = body;

    // Check required fields
    if (!user_id || !news_id || !time_spent_seconds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = await pool.getConnection();
    const query = `
      INSERT INTO user_interactions (user_id, news_id, rating, time_spent_seconds)
      VALUES (?, ?, ?, ?)
    `;
    await db.execute(query, [
      user_id,
      news_id,
      rating, // can be null
      time_spent_seconds,
    ]);
    db.release();

    return NextResponse.json({ message: 'User interaction saved' });
  } catch (error) {
    console.error('Error saving user interaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
