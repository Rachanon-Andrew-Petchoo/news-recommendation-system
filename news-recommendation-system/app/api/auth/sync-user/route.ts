import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/authOptions"
import mysql from "mysql2/promise"

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "cs510",
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const email = session.user.email
  const connection = await mysql.createConnection(dbConfig)

  try {
    const [rows] = await connection.execute(
      "SELECT user_id, email, created_at, updated_at FROM users WHERE email = ?",
      [email]
    )

    if (Array.isArray(rows) && rows.length === 0) {
      await connection.execute("INSERT INTO users (email) VALUES (?)", [email])
      return NextResponse.json({ message: "User inserted" })
    }

    return NextResponse.json({ message: "User already exists" })
  } catch (err) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  } finally {
    await connection.end()
  }
}