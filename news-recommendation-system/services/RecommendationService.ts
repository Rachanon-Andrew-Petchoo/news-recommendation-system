import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";
import { UserProfileService } from "./UserProfileService";

interface NewsRecommendation {
    news_id: number;
    title: string;
    description: string;
    url: string;
    url_to_image: string | null;
    published_at: Date;
    source_name: string;
    similarity_score: number;
}

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
    async getRecommendations(userId: number, limit: number = 10): Promise<NewsRecommendation[]> {
        try {
        // 1. Get the user's profile (either from cache or calculate it)
        const userProfile = await this.getUserProfile(userId);
        
        // 2. Fetch candidate news articles (not viewed by the user)
        const candidateArticles = await this.getCandidateArticles(userId);
        
        if (candidateArticles.length === 0) {
            return [];
        }
        
        // 3. Calculate similarity scores between user profile and each article
        const scoredArticles = candidateArticles.map(article => {
            const similarityScore = this.calculateCosineSimilarity(
            userProfile, 
            article.embedding
            );
            
            return {
            news_id: article.news_id,
            title: article.title,
            description: article.description,
            url: article.url,
            url_to_image: article.url_to_image,
            published_at: article.published_at,
            source_name: article.source_name,
            similarity_score: similarityScore
            };
        });
        
        // 4. Sort by similarity score (descending) and take the top 'limit' articles
        return scoredArticles
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, limit);
        
        } catch (error) {
            console.error(`Error getting recommendations for user ${userId}:`, error);
            throw error;
        }
  }
  
    /**
     * Get a user's profile, either from the database or by calculating it
     */
    private async getUserProfile(userId: number): Promise<number[]> {
        try {
        // First try to get existing profile from database
        const db = await pool.getConnection();
        const query = `
            SELECT user_embedding
            FROM user_profiles
            WHERE user_id = ?
        `;
        
        const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
        db.release();
        
        if (rows.length > 0 && rows[0].user_embedding) {
            // Profile exists? Parse it and return
            return JSON.parse(rows[0].user_embedding);
        }
        
        // Profile doesn't exist? Then calculate it!
        return await this.userProfileService.calculateUserProfile(userId);
        
        } catch (error) {
            console.error(`Error retrieving user profile for user ${userId}:`, error);
            throw error;
        }
    }
  
    /**
     * Get candidate news articles that the user hasn't viewed yet
     */
    private async getCandidateArticles(userId: number): Promise<{
        news_id: number;
        title: string;
        description: string;
        url: string;
        url_to_image: string | null;
        published_at: Date;
        source_name: string;
        embedding: number[];
    }[]> {
        const db = await pool.getConnection();
        
        // This query gets articles that the user hasn't interacted with yet
        const query = `
        SELECT 
            n.news_id,
            n.title,
            n.description,
            n.url,
            n.url_to_image,
            n.published_at,
            n.source_name,
            np.news_embedding
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
        `;
        
        const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
        db.release();
        
        return rows.map(row => ({
            news_id: row.news_id,
            title: row.title,
            description: row.description,
            url: row.url,
            url_to_image: row.url_to_image,
            published_at: new Date(row.published_at),
            source_name: row.source_name,
            embedding: JSON.parse(row.news_embedding)
        }));
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