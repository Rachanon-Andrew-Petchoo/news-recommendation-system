import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";
import { UserProfileService } from "./UserProfileService";
import { NewsOverview, NewsOverviewWithProbEmbedding_DB } from "@/types";

export class RecommendationService {
    private userProfileService: UserProfileService;
    
    constructor() {
        this.userProfileService = new UserProfileService();
    }
    
    /**
     * Get personalized news recommendations for a user
     * @param userId User ID
     * @param limit Maximum number of recommendations to return
     * @returns Recommended news articles array with similarity scores
     */
    async getRecommendations(userId: number, limit: number = 10, recalculateProfile: boolean = true): Promise<NewsOverview[]> {
        try {
            // 1. Fetch candidate news articles (not viewed by the user)
            const candidateArticles = await this.getCandidateArticles(userId);
            
            if (candidateArticles.length === 0) {
                return [];
            }

            // 2. Get the user's profile (always update profile with user interactions)
            const userProfile = await this.getUserProfile(userId, recalculateProfile);
        
            // 3. Calculate similarity scores between user profile and each article
            const scoredArticles = candidateArticles.map(article => {
                const similarityScore = this.calculateCosineSimilarity(
                    userProfile, 
                    article.prob_embedding
                );
                
                return {
                    ...article,
                    similarity_score: similarityScore
                };
            });
            
            // 4. Sort by similarity score (descending) and take the top 'limit' articles
            const topArticles: NewsOverview[] = scoredArticles
                .sort((a, b) => b.similarity_score - a.similarity_score)
                .slice(0, limit)
                .map(scoredArticle => ({
                    news_id: scoredArticle.news_id,
                    title: scoredArticle.title,
                    description: scoredArticle.description ?? undefined,
                    url_to_image: scoredArticle.url_to_image ?? undefined,
                }));

            return topArticles;
        
        } catch (error) {
            console.error(`Error getting recommendations for user ${userId}:`, error);
            throw error;
        }
  }
  
    /**
     * Get candidate news articles that the user hasn't viewed yet
     */
    private async getCandidateArticles(userId: number): Promise<NewsOverviewWithProbEmbedding_DB[]> {
        const db = await pool.getConnection();
        
        // This query gets articles that the user hasn't interacted with yet
        const query = `
            SELECT 
                n.news_id,
                n.title,
                n.description,
                n.url_to_image,
                np.prob_embedding
            FROM 
                news_articles n
            JOIN 
                news_profiles np ON n.news_id = np.news_id
            WHERE 
                n.news_id NOT IN (
                    SELECT news_id 
                    FROM user_interactions 
                    WHERE user_id = ?
                )
            AND 
                JSON_VALID(np.prob_embedding)
        `;
        
        const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
        db.release();
        
        return rows.map(row => ({
            news_id: row.news_id,
            title: row.title,
            description: row.description,
            url_to_image: row.url_to_image,
            prob_embedding: JSON.parse(row.prob_embedding)
        }));
    }

    private async getUserProfile(userId: number, recalculateProfile: boolean): Promise<number[]> {
        try {
            if (recalculateProfile === true) {
                return (await this.userProfileService.calculateUserProfile(userId));
            } else {
                const db = await pool.getConnection();
                const query = `
                    SELECT user_embedding
                    FROM user_profiles
                    WHERE user_id = ?
                `;
                const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
                db.release();
                
                // Profile exists? Parse it and return
                if (rows.length > 0 && rows[0].user_embedding) {
                    return JSON.parse(rows[0].user_embedding);
                }
                
                // Profile doesn't exist? Then calculate it!
                return (await this.userProfileService.calculateUserProfile(userId));
            }
        } catch (error) {
            console.error(`Error retrieving/creating user profile for user ${userId}:`, error);
            throw error;
        }
    }
  
    /**
     * Calculate cosine similarity between two vectors
     */
    private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
        if (vectorA.length !== vectorB.length) {
            throw new Error("Vectors must have the same length for cosine similarity calculation");
        }
        
        let dotProduct = 0;
        let magnitudeA = 0;
        let magnitudeB = 0;
        
        for (let i = 0; i < vectorA.length; i++) {
            dotProduct += vectorA[i] * vectorB[i];
            magnitudeA += vectorA[i] * vectorA[i];
            magnitudeB += vectorB[i] * vectorB[i];
        }
        
        magnitudeA = Math.sqrt(magnitudeA);
        magnitudeB = Math.sqrt(magnitudeB);
        
        // Handling zero magnitude vectors
        if (magnitudeA === 0 || magnitudeB === 0) {
            return 0;
        }
        
        return dotProduct / (magnitudeA * magnitudeB);
    }
}