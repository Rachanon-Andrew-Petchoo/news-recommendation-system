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
    const [rows]: any = await db.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [email]
    )

    if (Array.isArray(rows) && rows.length === 0) {
      const [result]: any = await db.execute(
        "INSERT INTO users (email) VALUES (?)",
        [email]
      )
      const userId = result.insertId
      return NextResponse.json({ message: "User inserted", user_id: userId })
    }

    const userId = rows[0].user_id
    return NextResponse.json({ message: "User already exists", user_id: userId })
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  } finally {
    db.release()
  }
}
