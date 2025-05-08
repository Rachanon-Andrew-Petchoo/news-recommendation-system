Users can now log in and out using their Google accounts. On first login, a new record is inserted into the users database.

## Runtime Setup:
1. Place the `env_local` file (in WhatsApp group chat) in the `/news-recommendation-system/news-recommendation-system/` directory and rename it to `.env.local` (it contains keys and cannot be pushed to GitHub; it is required for connecting to the Google SSO service).

2. Logging in does not require the database, but storing user information does. Use the following command to execute the SQL file and initialize the database:

```
mysql -u your_mysql_user -p < path/to/schema.sql
```

3. Update the `dbConfig` object in `app/api/auth/sync-user/route.ts` with your database credentials.

4. After logging in with a new account, you can verify that the user has been added using:

```
USE cs510;
SELECT * FROM users;
```

## Implementation Details
1. A new `auth` directory has been added under `app/api`.

   - **1.1** The `app/api/auth/[...nextauth]/` folder contains the logic for handling Google authentication.

   - **1.2** The `app/api/ayth/sync-user/` folder contains a `POST` endpoint that is called after login verification. It returns the user's email and login time. If it is the user's first login, a new row is inserted into the `users` table. No entry is made in the `user_profiles` table.

2. A login/logout button has been added to the top-right corner of the page in `layout.tsx`. Clicking it redirects users to authenticate with their Google account.

