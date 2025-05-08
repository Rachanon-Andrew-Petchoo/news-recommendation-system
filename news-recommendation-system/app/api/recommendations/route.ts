import { NextRequest, NextResponse } from "next/server";
import { RecommendationService } from "@/services/RecommendationService";
import { useUserId } from "@/app/components/SessionWrapper";

export async function GET(request: NextRequest) {
  try {
    const userId = useUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: User not logged in" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = (limitParam !== null) ? parseInt(limitParam) : undefined;

    // Get recommendations using the RecommendationService
    const recommendationService = new RecommendationService();
    const recommendations = await recommendationService.getRecommendations(userId, limit);

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
