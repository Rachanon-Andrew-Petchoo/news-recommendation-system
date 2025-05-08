import { NextRequest, NextResponse } from "next/server";
import { UserProfileService } from "@/services/UserProfileService";
import { useUserId } from "@/app/components/SessionWrapper";

export async function POST(request: NextRequest) {
  try {
    const userId = useUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: User not logged in" }, { status: 401 });
    }

    // Update user profile
    const userProfileService = new UserProfileService();
    await userProfileService.calculateUserProfile(userId);

    return NextResponse.json({ message: "Success: user profile updated" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}