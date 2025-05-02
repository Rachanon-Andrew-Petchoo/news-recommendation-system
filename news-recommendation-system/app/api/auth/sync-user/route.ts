import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/authOptions"
import pool from "@/libs/mysql"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email
  const db = await pool.getConnection()

  try {
    const [rows] = await db.execute(
      "SELECT user_id, email, created_at, updated_at FROM users WHERE email = ?",
      [email]
    )

    if (Array.isArray(rows) && rows.length === 0) {
      await db.execute("INSERT INTO users (email) VALUES (?)", [email])
      return NextResponse.json({ message: "User inserted" })
    }

    return NextResponse.json({ message: "User already exists" })
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  } finally {
    db.release()
  }
}
