# Personalized News Recommendation System

This project is a web-based personalized news recommendation system that delivers real-time, relevant articles tailored to individual user interests. It uses topic modeling (BERTopic) to analyze article content and models user preferences based on both explicit ratings and implicit reading behaviors.

## Features

- **User Authentication**  
  Enables Google SSO login to identify users and persist their interactions for personalized recommendations.

- **News Ingestion Module**  
  Fetches real-time news articles from NewsAPI and prepares them for processing.

- **Topic Modeling Pipeline**  
  Uses BERTopic to generate semantic embeddings for articles and GPT-based refinement for human-readable topic labels.

- **User Profiling**  
  Tracks both explicit and implicit user feedback to maintain a dynamic interest profile.

- **Recommendation Engine**  
  Computes similarity between user and article profiles to generate personalized article rankings.

- **News Serving Interface**  
  Displays recommended and categorized news articles with support for in-depth reading and real-time updates.

- **RESTful API Backend**  
  Exposes endpoints for the frontend to access user data, article content, and recommendations.


## Installation Instructions

1. Clone the repository:  
   `git clone https://github.com/Rachanon-Andrew-Petchoo/news-recommendation-system.git`

2. Navigate into the project directory:  
   `cd news-recommendation-system/`

3. Install Node.js:
   - macOS: `brew install node`
   - Ubuntu/Debian:  
     `sudo apt update`  
     `sudo apt install nodejs npm`

4. Install project dependencies:
   - `npm install`
   - `pip install -r requirements.txt`

5. Create a `.env` file using the template `.env.template`, or to access our completed application, please contact the owner.
   - For CS510 Prof. and TAs, the link to protected `.env` file is in the Final Report (full instructions available there).

6. Run the development server:  
   `npm run dev`
