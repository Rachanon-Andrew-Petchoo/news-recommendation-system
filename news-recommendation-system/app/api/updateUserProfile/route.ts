import { NextRequest, NextResponse } from "next/server";
import { UserProfileService } from "@/services/UserProfileService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/authOptions";
import pool from "@/libs/mysql";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from the database using session email
    const db = await pool.getConnection();
    const [rows]: any = await db.execute(
      "SELECT user_id FROM users WHERE email = ?",
      [session.user.email]
    );
    db.release();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = rows[0].user_id;

    // Update user profile
    const userProfileService = new UserProfileService();
    const userProfile = await userProfileService.calculateUserProfile(userId);

    return NextResponse.json({ 
      message: "User profile updated successfully",
      user_id: userId,
      profile_size: userProfile.length
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}