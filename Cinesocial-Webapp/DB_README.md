---
# CineSocial — Database Reference
## Stack: Microsoft SQL Server | Node.js backend via mssql package

---

## VIEWS

### vw_MovieSummary
**File:** database/new_queries.sql (line 4)
**Purpose:** Provides a high-level summary of movies including their average rating, combined genre list, and total review count.
**Used in:** backend/controllers/movieController.js → getAllMovies(), getMovieById()
**Called by route:** GET /api/movies, GET /api/movies/:id
**Columns returned:** Movie_ID, Title, M_Type, Release_date, avg_rating, Runtime, Synopsis, M_Language, Poster_URL, Trailer_URL, genres, total_reviews
**SQL:**
```sql
CREATE VIEW vw_MovieSummary AS
SELECT 
    m.Movie_ID, 
    m.Title, 
    m.M_Type, 
    m.Release_date, 
    m.A_Rating AS avg_rating,
    m.Runtime,
    m.Synopsis,
    m.M_Language,
    m.Poster_URL,
    m.Trailer_URL,
    (SELECT STRING_AGG(g.G_Name, ', ') FROM M_Genres mg JOIN Genres g ON mg.G_ID = g.G_ID WHERE mg.M_ID = m.Movie_ID) AS genres,
    (SELECT COUNT(*) FROM Activity a WHERE a.Movie_ID = m.Movie_ID AND a.Action_Type = 'REVIEW') AS total_reviews
FROM Movies m;
```

### vw_UserProfile
**File:** database/new_queries.sql (line 21)
**Purpose:** Aggregates user profile information alongside their active subscription plan details.
**Used in:** backend/controllers/userController.js → getProfile()
**Called by route:** GET /api/users/me, GET /api/users/:id
**Columns returned:** user_id, username, flair_label, is_valid, plan_name, sub_expiry, Email, Join_date, Bio, sub_ID, Profile_Pic_URL, Has_Profile_Flair
**SQL:**
```sql
CREATE VIEW vw_UserProfile AS
SELECT 
    u.User_ID AS user_id, 
    u.Username AS username, 
    u.flair_label, 
    u.is_valid, 
    s.Plan_Name AS plan_name, 
    u.sub_exp AS sub_expiry,
    u.Email,
    u.Join_date,
    u.Bio,
    u.sub_ID,
    u.Profile_Pic_URL,
    s.Has_Profile_Flair
FROM Users u
LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID;
```

### vw_CommunityVerdicts
**File:** database/new_queries.sql (line 39)
**Purpose:** Combines review activities with movie and user information for display in community feeds and movie pages.
**Used in:** backend/controllers/reviewController.js → getMovieReviews(); backend/controllers/movieController.js → getMovieById()
**Called by route:** GET /api/reviews/movie/:movieId, GET /api/movies/:id
**Columns returned:** activity_id, movie_title, reviewer_username, rating, review_text, is_pinned, timestamp, movie_id, Profile_Pic_URL, Action_Type
**SQL:**
```sql
CREATE VIEW vw_CommunityVerdicts AS
SELECT 
    a.Activity_ID AS activity_id, 
    m.Title AS movie_title, 
    u.Username AS reviewer_username, 
    a.Rating AS rating, 
    a.Review_text AS review_text, 
    a.Is_pinned AS is_pinned, 
    a.Time_stamp AS timestamp,
    a.Movie_ID AS movie_id,
    u.Profile_Pic_URL,
    a.Action_Type
FROM Activity a
JOIN Movies m ON a.Movie_ID = m.Movie_ID
JOIN Users u ON a.User_ID = u.User_ID
WHERE a.Action_Type = 'REVIEW';
```

### vw_ActiveParties
**File:** database/new_queries.sql (line 56)
**Purpose:** Retrieves a list of all currently active watch parties along with host and movie titles.
**Used in:** backend/controllers/partyController.js → getActiveParties()
**Called by route:** GET /api/parties
**Columns returned:** party_id, party_name, host, movie, current_member_count, max_members, is_active
**SQL:**
```sql
CREATE VIEW vw_ActiveParties AS
SELECT 
    p.Party_ID AS party_id, 
    p.Party_Name AS party_name, 
    u.Username AS host, 
    m.Title AS movie, 
    (SELECT COUNT(*) FROM P_Members pm WHERE pm.Party_ID = p.Party_ID) AS current_member_count,
    p.Max_Members AS max_members, 
    p.Is_Active AS is_active
FROM Parties p
JOIN Users u ON p.Created_By = u.User_ID
JOIN Movies m ON p.Movie_ID = m.Movie_ID
WHERE p.Is_Active = 1;
```

### vw_PublicLists
**File:** database/new_queries.sql (line 72)
**Purpose:** Retrieves all public movie lists (excluding watchlists) along with their total movie counts.
**Used in:** backend/controllers/listController.js → getPublicLists()
**Called by route:** GET /api/lists/public
**Columns returned:** list_id, list_title, owner_username, movie_count, is_watchlist, is_public
**SQL:**
```sql
CREATE VIEW vw_PublicLists AS
SELECT 
    l.List_ID AS list_id, 
    l.List_Title AS list_title, 
    u.Username AS owner_username, 
    (SELECT COUNT(*) FROM ListMovies lm WHERE lm.L_ID = l.List_ID) AS movie_count,
    l.is_watchlist, 
    l.is_public
FROM Lists l
JOIN Users u ON l.U_ID = u.User_ID
WHERE l.is_public = 1 AND l.is_watchlist = 0;
```

---

## STORED PROCEDURES

### sp_RegisterUser
**File:** database/new_queries.sql (line 91)
**Purpose:** Inserts a new user record securely with hashed passwords.
**Parameters:** @username VARCHAR, @email VARCHAR, @password VARCHAR
**Used in:** backend/controllers/authController.js → register()
**Called by route:** POST /api/auth/register
**SQL:**
```sql
CREATE PROCEDURE sp_RegisterUser
    @username VARCHAR(50),
    @email VARCHAR(100),
    @password VARCHAR(255)
...
```

### sp_SubmitReview
**File:** database/new_queries.sql (line 103)
**Purpose:** Logs a review activity and dynamically recalculates the movie's average rating.
**Parameters:** @userId INT, @movieId INT, @rating DECIMAL(3,1), @reviewText TEXT, @ip VARCHAR, @spoiler BIT
**Used in:** backend/controllers/reviewController.js → addReview()
**Called by route:** POST /api/reviews
**SQL:**
```sql
CREATE PROCEDURE sp_SubmitReview
    @userId INT,
    @movieId INT,
...
```

### sp_BanUser
**File:** database/new_queries.sql (line 123)
**Purpose:** Admin action to ban/unban a user and log the action.
**Parameters:** @userId INT, @banStatus BIT
**Used in:** backend/controllers/adminController.js → banUser(), banUserById(), unbanUserById()
**Called by route:** PUT /api/admin/ban, POST /api/admin/users/:id/ban, POST /api/admin/users/:id/unban
**SQL:**
```sql
CREATE PROCEDURE sp_BanUser
    @userId INT,
    @banStatus BIT
...
```

### sp_UpgradeToPremium
**File:** database/new_queries.sql (line 139)
**Purpose:** Upgrades a user's subscription and creates an entry in SubHistory.
**Parameters:** @userId INT, @planId INT, @duration INT
**Used in:** backend/controllers/subscriptionController.js → subscribe()
**Called by route:** POST /api/subscriptions/subscribe
**SQL:**
```sql
CREATE PROCEDURE sp_UpgradeToPremium
    @userId INT,
    @planId INT,
...
```

### sp_CreateParty
**File:** database/new_queries.sql (line 155)
**Purpose:** Creates a watch party and automatically adds the creator as host.
**Parameters:** @name VARCHAR, @createdBy INT, @movieId INT, @max INT, @inviteCode VARCHAR, @newPartyId INT OUTPUT
**Used in:** backend/controllers/partyController.js → createParty()
**Called by route:** POST /api/parties
**SQL:**
```sql
CREATE PROCEDURE sp_CreateParty
    @name VARCHAR(100),
...
```

### sp_AddMovieWithDetails
**File:** database/new_queries.sql (line 173)
**Purpose:** Inserts a movie along with its many-to-many relationship rows (Genres and Cast).
**Parameters:** @title VARCHAR, @mType VARCHAR, @releaseDate DATE, @runtime INT, @synopsis VARCHAR, @mLanguage VARCHAR, @posterUrl VARCHAR, @trailerUrl VARCHAR, @genreIds VARCHAR(MAX), @castIds VARCHAR(MAX), @newMovieId INT OUTPUT
**Used in:** backend/controllers/adminController.js → addMovie()
**Called by route:** POST /api/admin/movie
**SQL:**
```sql
CREATE PROCEDURE sp_AddMovieWithDetails
    @title VARCHAR(200),
...
```

### Q1 (Update Last Login)
**File:** database/new_queries.sql
**Purpose:** Updates last_login timestamp for an active, non-banned user on login.
**Parameters:** @UsersID INT
**Used in:** backend/controllers/authController.js → login()
**Called by route:** POST /api/auth/login
**SQL:**
```sql
CREATE PROCEDURE Q1
    @UsersID INT
AS
BEGIN
    UPDATE Users
    SET last_login = GETDATE()
    WHERE User_ID = @UsersID
      AND is_banned = 0
      AND is_valid = 1;
END;
```

---

## TRANSACTIONS

### txn_SubmitReview
**File:** backend/controllers/reviewController.js → addReview()
**Purpose:** Wraps INSERT into Activity and UPDATE Movies.avg_rating, rolling back if either fails. Ensures movie ratings remain consistent with activity logs.
**Code Pattern:**
```javascript
const transaction = new sql.Transaction(pool);
await transaction.begin();
try {
  // INSERT Activity
  // UPDATE Movies
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

### txn_UpgradeToPremium
**File:** backend/controllers/subscriptionController.js → subscribe()
**Purpose:** Upgrades a user account by updating Users, inserting into SubHistory, and logging the action in Activity atomically.
**Code Pattern:**
```javascript
const transaction = new sql.Transaction(pool);
await transaction.begin();
try {
  // UPDATE Users
  // INSERT INTO SubHistory
  // INSERT INTO Activity
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

### txn_CreateParty
**File:** backend/controllers/partyController.js → createParty()
**Purpose:** Wraps the insertion of a new party and immediately adds the creator as the host member, preventing empty unhosted parties.
**Code Pattern:**
```javascript
const transaction = new sql.Transaction(pool);
await transaction.begin();
try {
  // INSERT INTO Parties
  // INSERT INTO P_Members
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

### txn_JoinParty
**File:** backend/controllers/partyController.js → joinParty()
**Purpose:** Atomically checks if the party is full, inserts the user into P_Members, and updates Parties.Is_Active to false if the max member capacity is reached.
**Code Pattern:**
```javascript
const transaction = new sql.Transaction(pool);
await transaction.begin();
try {
  // SELECT current counts
  // INSERT INTO P_Members
  // UPDATE Parties (if full)
  await transaction.commit();
} catch (err) {
  await transaction.rollback();
  throw err;
}
```

---

## QUERIES — CONCEPTS & FUNCTIONALITIES

### getPopularByReviews (HAVING)
**File:** backend/controllers/movieController.js
**Purpose:** Retrieves popular movies having more than N reviews. Matches F13 logic using `HAVING COUNT(a.Rating) > N`.
**Route:** GET /api/movies/popular/:min

### getUnreviewedMovies (RIGHT JOIN)
**File:** backend/controllers/movieController.js
**Purpose:** Finds movies with zero reviews. Fulfills the RIGHT JOIN requirement by joining Activity right into Movies where Activity is NULL.
**Route:** GET /api/movies/unreviewed

### getCombinedActivity (UNION)
**File:** backend/controllers/adminController.js
**Purpose:** Provides a unified feed of both Review actions and Party Join actions. Matches the UNION requirement.
**Route:** GET /api/admin/activity

### getSystemReport (FULL OUTER JOIN)
**File:** backend/controllers/adminController.js
**Purpose:** Joins Users and Subscriptions completely to show all users (with or without plans) and all plans (even unused ones). Matches the FULL OUTER JOIN requirement.
**Route:** GET /api/admin/system-report

---

## LIVE FETCH SERVICE

**Module:** `database/seed.js`

To populate the local SQL Server database with real movie data from TMDB without fetching it live during user requests (which is now disabled to comply with project requirements), you must run the database seeder script.

### Running the Seeder

1. Make sure you have your `TMDB_API_KEY` defined in the `.env` file at the root of the backend folder.
2. Navigate to the `database` directory in the terminal.
3. Run `node seed.js` for a full seed operation.
4. (Optional) Run `node seed.js --dry-run` to fetch from TMDB without inserting into the local database, useful for debugging mappings.

The script connects directly to SQL Server and performs atomic operations to insert movies, cast, and genres safely.

### Live Fetch Disabled

### New columns (see `database/new_queries.sql`)

| Table | Column | Purpose |
|-------|--------|--------|
| `Movies` | `Tmdb_ID` (INT NULL) | TMDB movie id for rows created or matched from TMDB. Seeded rows that predate this column stay NULL and are treated as local-only (no TMDB hydrate). Value `-1` means TMDB returned 404 or an unrecoverable error for this row; the backend will not call TMDB again for that movie. |
| `Movies` | `Last_Fetched` (DATETIME NULL) | Updated when a TMDB `GET /movie/{id}` hydration finishes successfully (same transaction as cast insert), when TMDB returns 404 (`Tmdb_ID` set to `-1`), or when a non-404 fetch or DB transaction fails so the next retry waits 24 hours. New **stub** rows from search keep `NULL` until the first hydrate attempt so the first details view is not blocked by the backoff window. While cast is still empty and `Last_Fetched` is within the last 24 hours, TMDB is not called again. |
| `Persons` | `Tmdb_Person_ID` (INT NULL) | TMDB person id for deduplication and faster lookup during hydration; optional on legacy rows. |

### Stub vs hydrated lifecycle

1. **Stub:** `searchMovies` calls TMDB search, then for each of the top 10 results ensures a `Movies` row exists with `Tmdb_ID` set, core fields filled, and `M_Genres` populated from genre ids. No `M_Cast` rows are written yet (`is_stub` is true while cast count is zero). `Last_Fetched` stays NULL on insert.
2. **Hydrate:** `hydrateMovieDetails(internalMovieId)` runs when a user opens `GET /api/movies/:id`. If the movie has a positive `Tmdb_ID`, no `M_Cast` rows yet, and the 24-hour backoff does not apply, it calls TMDB `GET /movie/{tmdb_id}?append_to_response=credits,videos`, updates the `Movies` row (runtime, trailer, synopsis, etc.), inserts persons and `M_Cast` (top 15 cast plus directors) in one transaction, then sets `Last_Fetched`. After that, the movie is fully hydrated; further opens skip TMDB because `M_Cast` already exists.

### Routes that call TMDB

| Route | When TMDB is called |
|-------|---------------------|
| `GET /api/movies/search?q=...` | Always attempts `search/movie` and `search/person` in parallel with the local DB search (if `TMDB_API_KEY` or `TMDB_READ_ACCESS_TOKEN` is set). Stubs are inserted for new TMDB movie hits. Person search upserts `Persons`; if the query matches a returned person name, filmography is merged from `M_Cast` + `Movies`. |
| `GET /api/movies/:id` | After loading the movie from SQL, calls `hydrateMovieDetails` when `Tmdb_ID` is positive, there are no `M_Cast` rows, and the 24-hour rule allows a fetch. If hydration succeeds, the handler reloads the movie and cast from the DB before responding. |

---

## CONCEPTS COVERAGE CHECKLIST
| Concept | Functionality | Status |
|---|---|---|
| INSERT | F01, F03, txns, sps | ✅ |
| DELETE | F05 | ✅ |
| UPDATE | F02, F04, F06, txns, sps | ✅ |
| SELECT | All | ✅ |
| WHERE | All | ✅ |
| LIKE | F10 (searchMovies) | ✅ |
| HAVING | F13 (getPopularByReviews) | ✅ |
| UNION | F25 (getCombinedActivity)| ✅ |
| INTERSECTION | F25 | ✅ |
| EXCEPT | F24 | ✅ |
| COUNT | F09, F21 | ✅ |
| AVG | F08 | ✅ |
| MAX | F23 | ✅ |
| GROUP BY | F09, F13, F21 | ✅ |
| ORDER BY | F07, F17, F21 | ✅ |
| JOIN (INNER) | F11, F12, F14...| ✅ |
| LEFT JOIN | F20, F21 | ✅ |
| RIGHT JOIN | getUnreviewedMovies | ✅ |
| FULL OUTER JOIN | getSystemReport | ✅ |
| Nested / Subquery | F22, F23, F24 | ✅ |

---

## USE-CASE QUERY ENDPOINTS

### Q6 — Top Rated Movies (Rating > 3.0)
**File:** backend/controllers/movieController.js → getTopRatedMovies()
**Route:** GET /api/movies/top-rated

### Q7 — Average Rating Per Movie
**File:** backend/controllers/movieController.js → getAverageRatings()
**Route:** GET /api/movies/average-ratings

### Q8 — Review Count Per Movie
**File:** backend/controllers/reviewController.js → getReviewCountPerMovie()
**Route:** GET /api/reviews/counts

### Q11 — Filter Movies by Genre
**File:** backend/controllers/movieController.js → getMoviesByGenre()
**Route:** GET /api/movies/genre/:genreId

### Q12 — Get Full Cast of a Movie
**File:** backend/controllers/movieController.js → getMovieById()
**Route:** GET /api/movies/:id

### Q14 — Get Watchlist Movies
**File:** backend/controllers/listController.js → getWatchlist()
**Route:** GET /api/lists/watchlist

### Q15 — Get All Friends of a User
**File:** backend/controllers/friendController.js → getFriends()
**Route:** GET /api/friends

### Q16 — Active Premium Users
**File:** backend/controllers/subscriptionController.js → getActivePremiumUsers()
**Route:** GET /api/subscriptions/active-premium

### F18 — Active Parties with Host & Movie
**File:** backend/controllers/partyController.js → getActiveParties()
**Route:** GET /api/parties

### F19 — Get Members of a Specific Party
**File:** backend/controllers/partyController.js → getPartyMembers()
**Route:** GET /api/parties/:partyId/members

### F20 — Expired Subscriptions Report
**File:** backend/controllers/adminController.js → getExpiredSubscriptions()
**Route:** GET /api/admin/reports/expired-subscriptions
**Also:** Inline check in authController.js → login() for per-user expiry on login

### F21 — Public Curated Lists Ranked by Movie Count
**File:** backend/controllers/listController.js → getPublicListsRanked()
**Route:** GET /api/lists/public/ranked

### F23 — Movie with Highest Rating
**File:** backend/controllers/movieController.js → getHighestRatedMovie()
**Route:** GET /api/movies/highest-rated

### F24 — Movies NOT in Any List (EXCEPT)
**File:** backend/controllers/listController.js → getMoviesNotInAnyList()
**Route:** GET /api/lists/unlisted-movies

### F25 — Users Who Reviewed AND Joined a Party (INTERSECT)
**File:** backend/controllers/adminController.js → getReviewersInParties()
**Route:** GET /api/admin/reports/reviewers-in-parties

---

## ARTICLES

The Articles feature enables Cinephile (Premium) users to write long-form cinema articles. All articles are gated behind admin approval before appearing publicly.

---

### TABLE: Articles

**File:** `database/new_queries.sql` (Articles section)
**Purpose:** Stores long-form articles written by Cinephile users. Articles are held in `pending` status until an admin approves or rejects them.

| Column | Type | Description |
|---|---|---|
| `Article_ID` | INT IDENTITY PK | Auto-incrementing primary key |
| `Author_ID` | INT NOT NULL | FK → `Users.User_ID` |
| `Title` | VARCHAR(200) | Article headline |
| `Slug` | VARCHAR(220) UNIQUE | URL-safe version of title |
| `Body` | TEXT | Full article content |
| `Cover_Image_URL` | VARCHAR(255) NULL | Optional hero image |
| `Status` | VARCHAR(20) | `pending` \| `approved` \| `rejected` |
| `Rejection_Note` | TEXT NULL | Admin's reason if rejected |
| `Movie_ID` | INT NULL | FK → `Movies.Movie_ID` (optional link) |
| `Category` | VARCHAR(50) | `REVIEW` \| `ESSAY` \| `EDITORIAL` \| `ANALYSIS` \| `HOT TAKE` |
| `Created_At` | DATETIME | Submission timestamp |
| `Published_At` | DATETIME NULL | Set when admin approves |
| `Updated_At` | DATETIME | Last edit timestamp |
| `View_Count` | INT | Incremented on each public fetch |

**Constraints:**
- `FK_Articles_Author` → `Users(User_ID)`
- `FK_Articles_Movie` → `Movies(Movie_ID)`
- `CHK_Article_Status` → Status IN ('pending','approved','rejected')

---

### STORED PROCEDURE: sp_PublishArticle

**File:** `database/new_queries.sql` (Articles section)
**Purpose:** Admin action to approve and publish an article. Sets `Status = 'approved'`, records `Published_At`, and logs the event in the `Activity` table with `Action_Type = 'ARTICLE_APPROVED'`.
**Parameters:** `@articleId INT`, `@adminId INT`
**Used in:** `backend/controllers/articleController.js → approveArticle()`
**Called by route:** `POST /api/admin/articles/:id/approve`

```sql
CREATE PROCEDURE sp_PublishArticle
    @articleId INT,
    @adminId   INT
AS
BEGIN
    UPDATE Articles
    SET Status = 'approved', Published_At = GETDATE(), Updated_At = GETDATE()
    WHERE Article_ID = @articleId;

    INSERT INTO Activity (User_ID, Action_Type, Entity_type, Entity_ID, Details)
    VALUES (@adminId, 'ARTICLE_APPROVED', 'Article', @articleId, ...);
END;
```

---

### VIEW: vw_PublishedArticles

**File:** `database/new_queries.sql` (Articles section)
**Purpose:** Returns all approved articles joined with author username/flair and optional linked movie title. Used as the primary data source for the public articles listing and detail pages.
**Used in:** `backend/controllers/articleController.js → getPublishedArticles()`, `getArticleBySlug()`
**Called by routes:** `GET /api/articles`, `GET /api/articles/:slug`
**Columns returned:** `Article_ID, Author_ID, Title, Slug, Body, Cover_Image_URL, Status, Movie_ID, Category, Created_At, Published_At, Updated_At, View_Count, Username, flair_label, Movie_Title`

```sql
CREATE VIEW vw_PublishedArticles AS
SELECT
    a.*, u.Username, u.flair_label,
    m.Title AS Movie_Title
FROM Articles a
JOIN Users u ON a.Author_ID = u.User_ID
LEFT JOIN Movies m ON a.Movie_ID = m.Movie_ID
WHERE a.Status = 'approved';
```

---

## FRIENDS SYSTEM

The Friends system supports proper request-based friendship: a sender issues a request, the receiver accepts or declines, and only on acceptance are both rows written to the `Friends` table.

---

### TABLE: FriendRequests

**File:** `database/new_queries.sql` (Friends section)
**Purpose:** Stores pending, accepted, and declined friend requests. On acceptance `sp_AcceptFriendRequest` is called which writes the bidirectional `Friends` rows atomically.

| Column | Type | Description |
|---|---|---|
| `Request_ID` | INT IDENTITY PK | Auto-incrementing primary key |
| `Sender_ID` | INT NOT NULL | FK → `Users.User_ID` |
| `Receiver_ID` | INT NOT NULL | FK → `Users.User_ID` |
| `Status` | VARCHAR(20) | `pending` \| `accepted` \| `declined` |
| `Created_At` | DATETIME | When the request was sent |
| `Resolved_At` | DATETIME NULL | Set when accepted or declined |

**Constraints:** `CHK_FR_NoSelf` (Sender ≠ Receiver), `UQ_FR_Pair` (one request per pair), `CHK_FR_Status`

---

### STORED PROCEDURE: sp_AcceptFriendRequest

**File:** `database/new_queries.sql` (Friends section)
**Purpose:** Atomically marks a request `accepted` and inserts both `U_ID→F_ID` and `F_ID→U_ID` rows into `Friends`, wrapped in a transaction with rollback on error.
**Parameters:** `@requestId INT`, `@receiverId INT`
**Used in:** `backend/controllers/friendController.js → acceptRequest()`
**Called by route:** `POST /api/friends/request/:requestId/accept`

---

### VIEW: vw_FriendList

**File:** `database/new_queries.sql` (Friends section)
**Purpose:** Returns each user's confirmed friends with profile enrichment fields. One row per friendship direction (query by `User_ID = me`).
**Used in:** `backend/controllers/friendController.js → getFriends()`
**Called by routes:** `GET /api/friends`, profile page friends section
**Columns:** `User_ID, Friend_Username, Friend_ID, flair_label, Profile_Pic_URL, has_premium_flair`
