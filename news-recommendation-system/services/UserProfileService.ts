import pool from "@/libs/mysql";
import { RowDataPacket } from "mysql2";

// An abstract implementation of User Profile Service
// (PROBABLY) NEEDS TO BE HEAVILY EDITED!

interface UserInteraction {
    news_id: number;
    rating: number | null; // Explicit feedback - User Rating
    time_spent_seconds: number; // Implicit feedback
    viewed_at: Date; // Calculating recency with this parameter
    prob_embedding: number[]; // Article embedding vector
    content_length: number; // Document length for normalization
}

export class UserProfileService {
    // Feedback Scaling (Hyperparameter Group #1) - FEEL FREE TO ADJUST!
    private EXPLICIT_SCALE = 1.2; // Explicit feedback value as discussed in meeting
    private IMPLICIT_SCALE = 0.8; // Implicit feedback value as discussed in meeting
    
    // Decay Factor (Hyperparameter Group #2) - FEEL FREE TO ADJUST!
    private DECAY_FACTOR = 0.05 // Higher value indicates faster decay

    // Conversion ratio (Hyperparameter Group #3) - for ensuring proportional interest weight computation
    private WPM = 238 // Average reading speed (English) 
    private STARS_FOR_ONE_VISIT = 2
    private STARS_FOR_NEXT_READ = 0.5

    /**
     * Calculating a user's interest profile with this function
     * @param userId (User ID)
     * @returns user interest profile (as a vector)
     */
    
    // Ensure to run this on user login (create hook for this)
    async calculateUserProfile(userId: number): Promise<number[]> {
        try {
            // 1. Fetch all user interactions with associated news embeddings
            const interactions = await this.getUserInteractions(userId);
            let userProfile: number[] = [];

            // 2. Query the db to get prob_embeddings_dim
            if (interactions.length > 0) {
                const embeddingSize = interactions[0].prob_embedding.length;
                userProfile = new Array(embeddingSize).fill(1/embeddingSize); // Equal probability distribution
                
                // 3. Calculate weighted profile based on explicit and implicit feedback
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

    /**
     * This function retrieves all user interactions, along with news embeddings
     */
    private async getUserInteractions(userId: number): Promise<UserInteraction[]> {
        const db = await pool.getConnection();
        
        // Join query to get interactions, article content length, and embeddings
        const query = `
        SELECT 
            i.news_id, 
            i.rating, 
            i.time_spent_seconds, 
            i.viewed_at, 
            np.prob_embedding,
            LENGTH(na.content) + LENGTH(na.description) + LENGTH(na.title) as content_length
        FROM 
            user_interactions i
        JOIN 
            news_articles na ON i.news_id = na.news_id
        JOIN 
            news_profiles np ON i.news_id = np.news_id
        WHERE 
            i.user_id = ?
            AND np.prob_embedding IS NOT NULL
            AND np.prob_embedding != 'pending'
        ORDER BY 
            i.viewed_at DESC
        `;
        
        const [rows] = await db.execute<RowDataPacket[]>(query, [userId]);
        db.release();
        
        // Transform result rows to UserInteraction objects with parsed embeddings
        return rows.map(row => ({
            news_id: row.news_id,
            rating: row.rating,
            time_spent_seconds: row.time_spent_seconds,
            viewed_at: new Date(row.viewed_at),
            prob_embedding: JSON.parse(row.prob_embedding),
            content_length: row.content_length || 1000 // Just put 1000 as default. We can change it...
        }));
    }

    /**
     * Computing weighted user profile based on user interaction
     * Implicit Feedback = (visits + time_spent / doc_length) * IMPLICIT_SCALE * DECAY_FACTOR
     * Explicit Feedback = rating * 1.2 * DECAY_FACTOR
     */
    private computeWeightedProfile(interactions: UserInteraction[]): number[] {
        // Getting the most recent interaction timestamp to calculate relative recency
        const mostRecentTimestamp = Math.max(
            ...interactions.map(i => i.viewed_at.getTime())
        );
        
        // Starting with a zero vector for the user profile
        const embeddingSize = interactions[0].prob_embedding.length;
        const profile = new Array(embeddingSize).fill(0);
        
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
            let numRead = ((interaction.time_spent_seconds / 60) * this.WPM) / interaction.content_length;
            let numSubsequentRead = numRead - 1;
            if (numSubsequentRead < 0) {
                numSubsequentRead = 0
            }
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
                profile[i] /= totalWeight;
            }
        }
        
        return profile;
    }
      
    /**
     * Save or update the user profile in the database
     */
    private async saveUserProfile(userId: number, profile: number[]): Promise<void> {
        try {
            const db = await pool.getConnection();
            const query = `
            INSERT INTO user_profiles (user_id, user_embedding)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE user_embedding = ?
            `;
            
            const profileJson = JSON.stringify(profile);
            await db.execute(query, [userId, profileJson, profileJson]);
            db.release();
        }   catch (error) {
            console.error(`Error saving profile for user ${userId}:`, error);
            throw error;
        }
    }
}
