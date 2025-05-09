import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/authOptions";
import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized in /api/auth/getUserId" }, { status: 401 });
  }

  const email = session.user.email;
  const db = await pool.getConnection();

  try {
    const [rows] = await db.execute<RowDataPacket[]>(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      return NextResponse.json({ user_id: rows[0].user_id }, { status: 200 });
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching user ID:", error);
    return NextResponse.json({ error: "Database error in /api/auth/getUserId" }, { status: 500 });
  } finally {
    db.release();
  }
}
