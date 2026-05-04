---
# CineSocial — Database Reference
## Stack: Microsoft SQL Server | Node.js backend via mssql package

---

## VIEWS

### vw_MovieSummary
**File:** database/new_queries.sql (line 4)
**Purpose:** Provides a high-level summary of movies including their average rating, combined genre list, and total review count.
**Used in:** backend/controllers/movieController.js → getAllMovies()
**Called by route:** GET /api/movies
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
**Called by route:** GET /api/users/me (and GET /api/users/:id)
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
**Used in:** backend/controllers/reviewController.js → getMovieReviews()
**Called by route:** GET /api/reviews/movie/:movieId
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
**Used in:** backend/controllers/adminController.js → banUser()
**Called by route:** PUT /api/admin/ban
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
