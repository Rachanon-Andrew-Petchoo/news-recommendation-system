import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/services/RecommendationService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/authOptions";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from the query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    
    // Get user ID from the database using session email
    const userId = await getUserIdFromEmail(session.user.email);
    
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get recommendations using the RecommendationService
    const recommendationService = new RecommendationService();
    const recommendations = await recommendationService.getRecommendations(userId, limit);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Helper function to get user ID from email
async function getUserIdFromEmail(email: string): Promise<number | null> {
  const { db } = await import("@/libs/mysql");
  const connection = await db.getConnection();
  
  try {
    const [rows] = await connection.execute(
      "SELECT user_id FROM users WHERE email = ?", 
      [email]
    );
    
    if (Array.isArray(rows) && rows.length > 0) {
      return rows[0].user_id;
    }
    
    return null;
  } finally {
    connection.release();
  }
}