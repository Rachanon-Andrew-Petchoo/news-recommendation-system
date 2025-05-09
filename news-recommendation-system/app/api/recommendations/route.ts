import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { RecommendationService } from "@/services/RecommendationService";
import { authOptions } from "../auth/[...nextauth]/authOptions";

export async function GET(request: NextRequest) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const recalculateProfileParam = searchParams.get("recalculateProfile");
    const recalculateProfile = recalculateProfileParam
      ? recalculateProfileParam.toLowerCase() !== "false"
      : undefined;

    // Get recommendations using the RecommendationService
    const recommendationService = new RecommendationService();
    const recommendations = await recommendationService.getRecommendations(userId, limit, recalculateProfile);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
