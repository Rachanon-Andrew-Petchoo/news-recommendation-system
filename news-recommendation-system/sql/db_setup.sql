CREATE DATABASE cs510;

SHOW DATABASES;

USE cs510;

SHOW TABLES;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NOT NULL UNIQUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    user_embedding JSON NOT NULL,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE news_articles (
    news_id INT AUTO_INCREMENT PRIMARY KEY,
    source_id VARCHAR(100),
    source_name VARCHAR(255),
    author VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(2083) NOT NULL,
    url_to_image VARCHAR(2083),
    published_at DATETIME,
    content TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE news_profiles (
    news_id INT PRIMARY KEY,
    news_embedding JSON NOT NULL,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (news_id) REFERENCES news_articles(news_id) ON DELETE CASCADE
);

CREATE TABLE user_interactions (
    interaction_id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    news_id INT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),              -- Weight of implicit interest (optional)
    time_spent_seconds INT NOT NULL,                        -- Weight of implicit interest
    viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, -- For interest decay

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (news_id) REFERENCES news_articles(news_id) ON DELETE CASCADE
);