import { NextRequest, NextResponse } from "next/server";
import { UserProfileService } from "@/services/UserProfileService";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function POST(request: NextRequest) {
  try {
    // Get the session on the server-side
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user_id from internal API
    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/getUserId`, {
      method: "GET",
      headers: {
        Cookie: request.headers.get("cookie") || "", // Forward session cookie
      },
    });
    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }
    const { user_id: userId } = await res.json();

    // Update user profile
    const userProfileService = new UserProfileService();
    await userProfileService.calculateUserProfile(userId);

    return NextResponse.json({ message: "Success: user profile updated" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}