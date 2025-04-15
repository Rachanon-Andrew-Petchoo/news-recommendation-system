import { NextRequest, NextResponse } from "next/server";
import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";
import { TestCount } from "@/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
//   const stockId = searchParams.get("stockId"); // extract params from request

  try {
    const db = await pool.getConnection(); // connect to db - no need to modify

    const query = `SELECT COUNT(*) FROM users`; // write db query
    const [rows] = await db.execute<RowDataPacket[]>(query); // execute db query
    // const [rows] = await db.execute<RowDataPacket[]>(query, [email]); // specify params list - NEED!
    db.release();

    if (rows.length === 0) {
      return NextResponse.json({ error: "Count not found" }, { status: 404 }); // return if not fetching result - can modify to match your use case
    }

    const stockInfo = rows[0] as TestCount; // parse DB response as our custom Types (can add in types.ts)

    return NextResponse.json(stockInfo); // return result
  } catch (error) {
    return NextResponse.json(
      {
        error: error,
      },
      { status: 500 }
    );
  }
}