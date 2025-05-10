import pool from "@/libs/mysql";
import { UserInteractionWithNewsInfo_DB } from "@/types";
import { LetterText } from "lucide-react";
import { RowDataPacket } from "mysql2";

export class UserProfileService {
    // Feedback Scaling (Hyperparameter Group #1) - FEEL FREE TO ADJUST!
    private EXPLICIT_SCALE = 1.2; // Explicit feedback value as discussed in meeting
    private IMPLICIT_SCALE = 0.8; // Implicit feedback value as discussed in meeting
    
    // Decay Factor (Hyperparameter Group #2) - FEEL FREE TO ADJUST!
    private DECAY_FACTOR = 0.05 // Higher value indicates faster decay

    // Conversion ratio (Hyperparameter Group #3) - for ensuring proportional interest weight computation
    private WPM = 238 // Average reading speed (English) 
    private WPS = this.WPM / 60
    private STARS_FOR_ONE_VISIT = 2
    private STARS_FOR_NEXT_READ = 0.5

    /**
     * Calculating a user's interest profile with this function
     * @param userId (User ID)
     * @returns user interest profile (as a vector)
     */
    async calculateUserProfile(userId: number): Promise<number[]> {
        try {
            // 1. Fetch all user interactions with associated news embeddings
            const interactions = await this.getUserInteractions(userId);
            
            // 2. Initialize user profile with equal probability distribution
            const embeddingSize = await this.getProbEmbeddingsDimension();
            let userProfile = Array.from({ length: embeddingSize }, () => 1 / embeddingSize);
        
            // 3. Calculate weighted profile based on explicit and implicit feedback (if available)
            if (interactions.length > 0) {                    
                userProfile = this.computeWeightedProfile(interactions);
            }
            
            // 4. Store the updated profile
            await this.saveUserProfile(userId, userProfile);
            
            return userProfile;
        }   catch (error) {
            console.error(`Error calculating profile for user ${userId}:`, error);
            throw error;
        }
    }

    private async getProbEmbeddingsDimension(): Promise<number> {
        const db = await pool.getConnection();
        const query = `
            SELECT prob_embedding
            FROM news_profiles
            WHERE (prob_embedding IS NOT NULL)
            LIMIT 1;
        `;
        const [rows] = await db.execute<RowDataPacket[]>(query);
        db.release();
    
        if (rows.length === 0) {
            throw new Error("No valid prob_embedding found in news_profiles");
        }
    
        const embedding = rows[0].prob_embedding;
        if (!Array.isArray(embedding)) {
            throw new Error("prob_embedding is not a valid array");
        }
    
        return embedding.length;
    }

    /**
     * This function retrieves all user interactions, along with news embeddings
     */
    private async getUserInteractions(userId: number): Promise<UserInteractionWithNewsInfo_DB[]> {
        const db = await pool.getConnection();
        
        // Join query to get interactions, article content length, and embeddings
        const query = `
        SELECT 
            i.news_id, 
            i.rating, 
            i.time_spent_seconds, 
            i.viewed_at, 
            np.prob_embedding,
            LENGTH(IFNULL(na.content, '')) + LENGTH(IFNULL(na.description, '')) + LENGTH(IFNULL(na.title, '')) AS content_length
        FROM 
            user_interactions i
        JOIN 
            news_articles na ON i.news_id = na.news_id
        JOIN 
            news_profiles np ON i.news_id = np.news_id
        WHERE 
            i.user_id = ?
        AND 
            (np.prob_embedding IS NOT NULL)
    `;

        const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
        db.release();
        
        // Transform result rows to UserInteractionWithNewsInfo_DB objects with parsed embeddings
        return rows.map(row => ({
            news_id: row.news_id,
            rating: row.rating,
            time_spent_seconds: row.time_spent_seconds,
            viewed_at: new Date(row.viewed_at),
            prob_embedding: row.prob_embedding,
            content_length: row.content_length
        }));
    }

    private computeWeightedProfile(interactions: UserInteractionWithNewsInfo_DB[]): number[] {
        // Getting the most recent interaction timestamp to calculate relative recency
        const mostRecentTimestamp = Math.max(
            ...interactions.map(i => i.viewed_at.getTime())
        );
        
        // Starting with a zero vector for the user profile
        const embeddingSize = interactions[0].prob_embedding.length;
        let profile = Array.from({ length: embeddingSize }, () => 0);
        
        // Tracking total weight for normalization
        let totalWeight = 0;
        
        // Calculating weighted sum of article embeddings
        for (const interaction of interactions) {
            // Calculating recency decay (days since interaction)
            const daysSinceInteraction = (mostRecentTimestamp - interaction.viewed_at.getTime()) / (1000 * 60 * 60 * 24);
            const recencyDecay = Math.exp(-this.DECAY_FACTOR * daysSinceInteraction);
          
            // Calculating explicit component (if rating exists)
            let explicitRatings = 0;
            if (interaction.rating !== null) {
                explicitRatings = interaction.rating;
            }
          
            // Calculating implicit component (normalized by content length)
            let numRead = (interaction.time_spent_seconds * this.WPS) / interaction.content_length;
            let numSubsequentRead = numRead - 1;
            numSubsequentRead = Math.max(0, numSubsequentRead);

            const implicitRatings = this.STARS_FOR_ONE_VISIT + (numSubsequentRead * this.STARS_FOR_NEXT_READ); // Add x stars to each subsequent read
          
            // Combining explicit and implicit components
            const interestWeight = ((this.EXPLICIT_SCALE * explicitRatings) + (this.IMPLICIT_SCALE * implicitRatings)) * recencyDecay;
            totalWeight += interestWeight;
          
            // Add weighted embedding to the profile
            for (let i = 0; i < profile.length; i++) {
                profile[i] += interaction.prob_embedding[i] * interestWeight;
            }
        }
        
        // Normalize the profile vector (if there is any weight)
        if (totalWeight > 0) {
            for (let i = 0; i < profile.length; i++) {
                profile[i] = isNaN(profile[i]) ? 0 : profile[i] / totalWeight; // Handle NaN
            }
        }
        
        return profile;
    }
      
    /**
     * Save or update the user profile in the database
     */
    private async saveUserProfile(userId: number, profile: number[]): Promise<void> {
        const db = await pool.getConnection();
        try {
            const query = `
                INSERT INTO user_profiles (user_id, user_embedding)
                VALUES (?, ?)
                ON DUPLICATE KEY UPDATE user_embedding = ?
            `;
            const profileJson = JSON.stringify(profile);
            await db.execute(query, [userId, profileJson, profileJson]);
        } catch (error) {
            console.error(`Error saving profile for user ${userId}:`, error);
            throw error;
        } finally {
            db.release();
        }
    }
}
