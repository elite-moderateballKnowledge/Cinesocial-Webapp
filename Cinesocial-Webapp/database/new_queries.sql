-- =============================================================
-- CineSocial — Queries Distributed by Use Case
-- Team Unassigned
-- Omer Farooq   24L-0616
-- Azfar Tauqeer 24L-0666
-- Abdullah Saeed 24L-3056
-- =============================================================


-- =============================================================
-- UC-01: Register Account
-- Actor: Guest
-- Tables: Users
-- Description: Insert a new user into the system.
-- =============================================================

-- STORED PROCEDURE (sp_RegisterUser)
-- Called from backend with .execute('sp_RegisterUser')
CREATE PROCEDURE sp_RegisterUser
    @username VARCHAR(50),
    @email    VARCHAR(100),
    @password VARCHAR(255)
AS
BEGIN
    INSERT INTO Users (Username, Email, Password_hash)
    VALUES (@username, @email, @password);
END;
GO

-- DML: Manual INSERT (used in testing / Query 9 by 24L-0616)
INSERT INTO Users (Username, Email, Password_hash, Bio, Profile_Pic_URL)
VALUES ('new_user', 'newuser@email.com', '$2b$12$somehashedpassword', 'Hey I am new here!', NULL);
GO


-- =============================================================
-- UC-02: Log In
-- Actor: Registered User / Premium User / Admin
-- Tables: Users
-- Description: Authenticate user, update last_login timestamp.
-- =============================================================

-- STORED PROCEDURE (Q1 by 24L-0616)
-- Updates last_login only if user is active and not banned
CREATE PROCEDURE Q1
    @UsersID INT
AS
BEGIN
    UPDATE Users
    SET last_login = GETDATE()
    WHERE User_ID  = @UsersID
      AND is_banned = 0
      AND is_valid  = 1;
END;
GO

-- VIEW: vw_UserProfile
-- Used by backend to fetch full user details including subscription on login
CREATE VIEW vw_UserProfile AS
SELECT
    u.User_ID        AS user_id,
    u.Username       AS username,
    u.flair_label,
    u.is_valid,
    s.Plan_Name      AS plan_name,
    u.sub_exp        AS sub_expiry,
    u.Email,
    u.Join_date,
    u.Bio,
    u.sub_ID,
    u.Profile_Pic_URL,
    s.Has_Profile_Flair
FROM Users u
LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID;
GO


-- =============================================================
-- UC-03: Log Out
-- Actor: Registered User / Premium User
-- Tables: none (handled entirely on frontend — localStorage cleared)
-- Description: No SQL required. JWT removed from browser storage.
-- =============================================================

-- No queries — logout is frontend-only.
-- The JWT token expires server-side after 1 day automatically.


-- =============================================================
-- UC-04: Edit Profile
-- Actor: Registered User / Premium User
-- Tables: Users
-- Description: Update bio, profile picture, or username.
-- =============================================================

-- DML: UPDATE bio and flair (used by userController via raw query or view)
UPDATE Users
SET Bio         = 'Updated bio here',
    flair_label = 'My Flair'
WHERE User_ID = 1;
GO

-- VIEW: vw_UserProfile (defined in UC-02 above)
-- Reused here — Profile.jsx fetches /api/users/me which queries this view
-- SELECT * FROM vw_UserProfile WHERE user_id = @userId


-- =============================================================
-- UC-05: Select Genre Preferences
-- Actor: Registered User / Premium User
-- Tables: UserGenres, Genres
-- Description: Save user's selected genre preferences.
-- =============================================================

-- DML: DELETE old preferences then INSERT new ones
-- (backend loops and inserts one row per selected genre)
DELETE FROM UserGenres WHERE User_ID = 1;
GO

INSERT INTO UserGenres (User_ID, G_ID) VALUES (1, 3);
INSERT INTO UserGenres (User_ID, G_ID) VALUES (1, 4);
INSERT INTO UserGenres (User_ID, G_ID) VALUES (1, 1);
GO


-- =============================================================
-- UC-06: View Subscription Plans
-- Actor: Guest / Registered User / Premium User
-- Tables: Subscriptions
-- Description: Read-only fetch of all available plans.
-- =============================================================

-- SELECT: Fetch all subscription plans (no auth needed)
SELECT
    Subscription_ID,
    Plan_Name,
    Price_USD,
    Duration_Days,
    Can_Join_Parties,
    Can_Pin_Reviews,
    Has_Profile_Flair,
    Max_Party_Size
FROM Subscriptions;
GO


-- =============================================================
-- UC-07: Upgrade to Premium
-- Actor: Registered User
-- Tables: Users, SubHistory, Subscriptions
-- Description: Update user subscription and log history.
--              Both writes should be wrapped in a transaction.
-- =============================================================

-- STORED PROCEDURE (sp_UpgradeToPremium)
-- Performs UPDATE on Users and INSERT into SubHistory atomically
CREATE PROCEDURE sp_UpgradeToPremium
    @userId   INT,
    @planId   INT,
    @duration INT
AS
BEGIN
    DECLARE @endDate DATETIME = DATEADD(day, @duration, GETDATE());

    UPDATE Users
    SET sub_ID  = @planId,
        sub_exp = @endDate
    WHERE User_ID = @userId;

    INSERT INTO SubHistory (User_ID, Subscription_ID, Start_Date, End_Date, Payment_Status)
    VALUES (@userId, @planId, GETDATE(), @endDate, 'Paid');
END;
GO

-- Query 16 (by 24L-0666): Find all currently active premium users
SELECT *
FROM Users u
JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
WHERE u.sub_ID IS NOT NULL
  AND u.sub_exp > GETDATE();
GO


-- =============================================================
-- UC-08: Subscription Expires
-- Actor: System (scheduled job or login check)
-- Tables: Users, Activity
-- Description: Detect expired subscriptions, revoke access, log event.
-- =============================================================

-- Query F20 (by 24L-3056): Find all users whose subscription has expired
SELECT u.User_ID, u.Username, u.Email, u.sub_exp
FROM Users u
LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
WHERE u.sub_exp < GETDATE()
  AND u.sub_ID IS NOT NULL;
GO

-- DML: Revoke premium access for expired user
UPDATE Users
SET is_valid = 0
WHERE sub_exp < GETDATE()
  AND sub_ID IS NOT NULL;
GO

-- DML: Log expiry event in Activity table
INSERT INTO Activity (User_ID, Action_Type, Details)
VALUES (1, 'SUBSCRIPTION_EXPIRED', 'Subscription expired automatically');
GO


-- =============================================================
-- UC-09: Set Profile Flair / Badge
-- Actor: Premium User
-- Tables: Users, Subscriptions (checked for Has_Profile_Flair)
-- Description: Premium users set a flair label and badge on their profile.
-- =============================================================

-- DML: Update flair fields (backend verifies Has_Profile_Flair = 1 first)
UPDATE Users
SET flair_label       = 'Pro Critic',
    has_premium_flair = 1
WHERE User_ID = 1;
GO

-- SELECT: Check if user has flair permission (JOIN used in backend guard)
SELECT s.Has_Profile_Flair
FROM Users u
JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
WHERE u.User_ID = 1
  AND u.sub_exp > GETDATE();
GO


-- =============================================================
-- UC-10: Browse Movie Catalogue
-- Actor: Guest / Registered User / Premium User
-- Tables: Movies, M_Genres, Genres (via view)
-- Description: Fetch paginated list of all movies with genres and rating.
-- =============================================================

-- VIEW: vw_MovieSummary
-- Used by movieController to return movie list with genres + review count
CREATE VIEW vw_MovieSummary AS
SELECT
    m.Movie_ID,
    m.Title,
    m.M_Type,
    m.Release_date,
    m.A_Rating        AS avg_rating,
    m.Runtime,
    m.Synopsis,
    m.M_Language,
    m.Poster_URL,
    m.Trailer_URL,
    (SELECT STRING_AGG(g.G_Name, ', ')
     FROM M_Genres mg
     JOIN Genres g ON mg.G_ID = g.G_ID
     WHERE mg.M_ID = m.Movie_ID)                                    AS genres,
    (SELECT COUNT(*)
     FROM Activity a
     WHERE a.Movie_ID = m.Movie_ID
       AND a.Action_Type = 'REVIEW')                                AS total_reviews
FROM Movies m;
GO

-- Query 6 (by 24L-0616): Fetch movies with rating > 3.0 ordered by newest
SELECT * FROM Movies
WHERE A_Rating > 3.0
ORDER BY Movie_ID DESC;
GO

-- Query 17 (by 24L-0666): Sort all movies by release date descending
SELECT * FROM Movies
ORDER BY Release_date DESC;
GO


-- =============================================================
-- UC-11: Search Movies
-- Actor: Guest / Registered User / Premium User
-- Tables: Movies
-- Description: Search movies by title keyword.
-- =============================================================

-- Query 10 (by 24L-0666): Search movies whose title contains letter 'a'
SELECT *
FROM Movies
WHERE Title LIKE '%a%';
GO


-- =============================================================
-- UC-12: Filter and Sort Movies
-- Actor: Guest / Registered User / Premium User
-- Tables: Movies, M_Genres, Genres
-- Description: Filter by genre or type, sort by rating/date/title.
-- =============================================================

-- Query 11 (by 24L-0666): Filter movies by a specific genre (G_ID = 2)
SELECT *
FROM Movies
JOIN M_Genres g1 ON Movie_ID = g1.M_ID
JOIN Genres   g2 ON g1.G_ID  = g2.G_ID
WHERE g1.G_ID = 2;
GO

-- Query 13 (by 24L-0666): Movies with more than N reviews (N=10)
SELECT m.Movie_ID, m.Title
FROM Movies m
JOIN Activity a ON m.Movie_ID = a.Movie_ID
GROUP BY m.Movie_ID, m.Title
HAVING COUNT(a.Rating) > 10;
GO


-- =============================================================
-- UC-13: View Movie Details Page
-- Actor: Guest / Registered User / Premium User
-- Tables: Movies, M_Genres, Genres, Activity, Users (via views)
-- Description: Fetch full movie details including genres and reviews.
-- =============================================================

-- VIEW: vw_MovieSummary (defined in UC-10 above)
-- SELECT * FROM vw_MovieSummary WHERE Movie_ID = @movieId

-- VIEW: vw_CommunityVerdicts
-- Used to show all reviews for a movie on its details page
CREATE VIEW vw_CommunityVerdicts AS
SELECT
    a.Activity_ID        AS activity_id,
    m.Title              AS movie_title,
    u.Username           AS reviewer_username,
    a.Rating             AS rating,
    a.Review_text        AS review_text,
    a.Is_pinned          AS is_pinned,
    a.Time_stamp         AS timestamp,
    a.Movie_ID           AS movie_id,
    u.Profile_Pic_URL,
    a.Action_Type
FROM Activity a
JOIN Movies m ON a.Movie_ID = m.Movie_ID
JOIN Users  u ON a.User_ID  = u.User_ID
WHERE a.Action_Type = 'REVIEW';
GO

-- Query 7 (by 24L-0616): Average rating per movie
SELECT DISTINCT(Movie_ID), AVG(Rating) AS Average_rating
FROM Activity
GROUP BY Movie_ID;
GO

-- Query F23 (by 24L-3056): Movie with the highest rating
SELECT Movie_ID, Title, A_Rating
FROM Movies
WHERE A_Rating = (SELECT MAX(A_Rating) FROM Movies);
GO

-- Query F22 (by 24L-3056): Movies that have no reviews yet
SELECT m.Movie_ID, m.Title, m.A_Rating
FROM Movies m
LEFT JOIN Activity a ON m.Movie_ID = a.Movie_ID
                     AND a.Action_Type = 'REVIEW'
WHERE a.Activity_ID IS NULL;
GO


-- =============================================================
-- UC-14: View Cast and Crew
-- Actor: Guest / Registered User / Premium User
-- Tables: M_Cast, Persons, Movies
-- Description: Fetch cast and crew for a specific movie.
-- =============================================================

-- Query 12 (by 24L-0666): Get full cast of Movie_ID = 3
SELECT Full_Name, Role_Type, Character_Name
FROM M_Cast
JOIN Movies  ON M_ID     = Movie_ID
JOIN Persons ON P_ID     = Person_ID
WHERE Movie_ID = 3;
GO


-- =============================================================
-- UC-15: Submit Review
-- Actor: Registered User / Premium User
-- Tables: Activity, Movies (A_Rating recalculated)
-- Description: Insert review row and update movie average rating.
-- =============================================================

-- STORED PROCEDURE (sp_SubmitReview)
-- Inserts review AND recalculates A_Rating in one call
CREATE PROCEDURE sp_SubmitReview
    @userId     INT,
    @movieId    INT,
    @rating     DECIMAL(3,1),
    @reviewText TEXT,
    @ip         VARCHAR(45),
    @spoiler    BIT
AS
BEGIN
    INSERT INTO Activity (User_ID, Action_Type, Movie_ID, Rating, Review_text,
                          Entity_type, Entity_ID, IP_Address, Contains_spoiler, Is_pinned)
    VALUES (@userId, 'REVIEW', @movieId, @rating, @reviewText,
            'Movie', @movieId, @ip, @spoiler, 0);

    DECLARE @newAvg DECIMAL(3,1);
    SELECT @newAvg = AVG(Rating)
    FROM Activity
    WHERE Movie_ID = @movieId AND Action_Type = 'REVIEW';

    UPDATE Movies SET A_Rating = @newAvg WHERE Movie_ID = @movieId;
END;
GO

-- DML: Manual review insert (Query 2 by 24L-0616)
INSERT INTO Activity (User_ID, Action_Type, Movie_ID, Rating, Review_text,
                      Entity_type, Entity_ID, IP_Address, Contains_spoiler, Is_pinned, Details)
VALUES (1, 'REVIEW', 6, 5.0, 'GOOD MOVIE', 'Movie', 6, '192.168.1.1', 0, 0, NULL);
GO

-- Query 8 (by 24L-0616): Count of reviews per movie
SELECT Movie_ID, COUNT(*) AS No_of_reviews
FROM Activity
WHERE Action_Type = 'REVIEW'
GROUP BY Movie_ID;
GO


-- =============================================================
-- UC-16: Edit or Delete Own Review
-- Actor: Registered User / Premium User
-- Tables: Activity
-- Description: Update or delete a review the user owns.
-- =============================================================

-- DML: Edit review text (Query 3 by 24L-0616)
UPDATE Activity
SET Review_text = 'Good'
WHERE User_ID  = 1
  AND Movie_ID = 2;
GO

-- DML: Delete a review (Query 4 by 24L-0616)
DELETE FROM Activity
WHERE Activity_ID = 1;
GO


-- =============================================================
-- UC-17: Pin Review to Top
-- Actor: Premium User
-- Tables: Activity
-- Description: Set Is_pinned = 1 on a review (premium only).
-- =============================================================

-- DML: Pin a specific review
UPDATE Activity
SET Is_pinned = 1
WHERE Activity_ID = 1
  AND User_ID     = 1;
GO

-- VIEW: vw_CommunityVerdicts (defined in UC-13)
-- Already includes Is_pinned — frontend sorts pinned reviews to top


-- =============================================================
-- UC-18: View and Manage Watchlist
-- Actor: Registered User / Premium User
-- Tables: Lists, ListMovies
-- Description: View, add, update, or remove movies from watchlist.
-- =============================================================

-- Query 14 (by 24L-0666): Get all watchlist movies for User_ID = 1
SELECT *
FROM Movies m
JOIN ListMovies l1 ON m.Movie_ID = l1.M_ID
JOIN Lists      l2 ON l1.L_ID   = l2.List_ID
JOIN Users       u ON l2.U_ID   = u.User_ID
WHERE l2.is_watchlist = 1
  AND u.User_ID       = 1;
GO

-- DML: Add a movie to watchlist
INSERT INTO ListMovies (L_ID, M_ID, Watch_status)
VALUES (1, 9, 'pending');
GO

-- DML: Update watch status
UPDATE ListMovies
SET Watch_status = 'watched'
WHERE L_ID = 1 AND M_ID = 9;
GO

-- DML: Remove movie from watchlist
DELETE FROM ListMovies
WHERE L_ID = 1 AND M_ID = 9;
GO


-- =============================================================
-- UC-19: Create and Manage Curated List
-- Actor: Registered User / Premium User
-- Tables: Lists, ListMovies
-- Description: Create named public/private lists and add movies.
-- =============================================================

-- VIEW: vw_PublicLists
-- Shows all public non-watchlist lists with movie count
CREATE VIEW vw_PublicLists AS
SELECT
    l.List_ID        AS list_id,
    l.List_Title     AS list_title,
    u.Username       AS owner_username,
    (SELECT COUNT(*) FROM ListMovies lm WHERE lm.L_ID = l.List_ID) AS movie_count,
    l.is_watchlist,
    l.is_public
FROM Lists l
JOIN Users u ON l.U_ID = u.User_ID
WHERE l.is_public = 1 AND l.is_watchlist = 0;
GO

-- Query F21 (by 24L-3056): All public curated lists ordered by movie count
SELECT l.List_ID, l.List_Title, u.Username, COUNT(lm.M_ID) AS total_movies
FROM Lists l
JOIN Users      u  ON l.U_ID    = u.User_ID
LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
WHERE l.is_watchlist = 0
  AND l.is_public    = 1
GROUP BY l.List_ID, l.List_Title, u.Username
ORDER BY total_movies DESC;
GO

-- Query F24 (by 24L-3056): Movies in any genre that are NOT in any list (EXCEPT)
SELECT m.Movie_ID, m.Title
FROM Movies m
JOIN M_Genres mg ON m.Movie_ID = mg.M_ID
WHERE mg.G_ID IN (
    SELECT G_ID FROM M_Genres
    WHERE M_ID IN (SELECT M_ID FROM M_Genres)
)
EXCEPT
SELECT m.Movie_ID, m.Title
FROM Movies m
WHERE m.Movie_ID IN (SELECT M_ID FROM ListMovies);
GO


-- =============================================================
-- UC-20: Add or Remove Friend
-- Actor: Registered User / Premium User
-- Tables: Friends, Users
-- Description: Insert or delete bidirectional friend relationship.
-- =============================================================

-- Query 15 (by 24L-0666): Get all friends of User_ID = 6
SELECT *
FROM Friends f
JOIN Users u ON f.F_ID = u.User_ID
WHERE f.U_ID = 6;
GO

-- DML: Add friend (both directions required)
INSERT INTO Friends (U_ID, F_ID) VALUES (1, 5);
INSERT INTO Friends (U_ID, F_ID) VALUES (5, 1);
GO

-- DML: Remove friend
DELETE FROM Friends WHERE U_ID = 1 AND F_ID = 5;
DELETE FROM Friends WHERE U_ID = 5 AND F_ID = 1;
GO


-- =============================================================
-- UC-21: Create Watch Party
-- Actor: Premium User
-- Tables: Parties, P_Members
-- Description: Insert party row and add creator as host.
-- =============================================================

-- STORED PROCEDURE (sp_CreateParty)
-- Creates party and adds host in one atomic call
-- Returns new Party_ID via OUTPUT parameter
CREATE PROCEDURE sp_CreateParty
    @name        VARCHAR(100),
    @createdBy   INT,
    @movieId     INT,
    @max         INT,
    @inviteCode  VARCHAR(20),
    @newPartyId  INT OUTPUT
AS
BEGIN
    INSERT INTO Parties (Party_Name, Created_By, Movie_ID, Max_Members, Invite_Code, Is_Active)
    VALUES (@name, @createdBy, @movieId, @max, @inviteCode, 1);

    SET @newPartyId = SCOPE_IDENTITY();

    INSERT INTO P_Members (Party_ID, User_ID, Role)
    VALUES (@newPartyId, @createdBy, 'host');
END;
GO

-- VIEW: vw_ActiveParties
-- Shows all currently active parties with member count
CREATE VIEW vw_ActiveParties AS
SELECT
    p.Party_ID   AS party_id,
    p.Party_Name AS party_name,
    u.Username   AS host,
    m.Title      AS movie,
    (SELECT COUNT(*) FROM P_Members pm WHERE pm.Party_ID = p.Party_ID) AS current_member_count,
    p.Max_Members AS max_members,
    p.Is_Active   AS is_active
FROM Parties p
JOIN Users  u ON p.Created_By = u.User_ID
JOIN Movies m ON p.Movie_ID   = m.Movie_ID
WHERE p.Is_Active = 1;
GO

-- Query F18 (by 24L-3056): All active parties with host and movie info
SELECT p.Party_ID, p.Party_Name, u.Username AS host, m.Title AS movie,
       p.Max_Members, p.Is_Active
FROM Parties p
JOIN Users  u ON p.Created_By = u.User_ID
JOIN Movies m ON p.Movie_ID   = m.Movie_ID
WHERE p.Is_Active = 1;
GO


-- =============================================================
-- UC-22: Join Watch Party
-- Actor: Premium User
-- Tables: P_Members, Parties
-- Description: Validate invite code and add user as member.
-- =============================================================

-- SELECT: Validate invite code and check capacity
SELECT Party_ID, Is_Active, Max_Members,
       (SELECT COUNT(*) FROM P_Members WHERE Party_ID = p.Party_ID) AS current_count
FROM Parties p
WHERE Invite_Code = 'NOLAN2025';
GO

-- DML: Add user as member
INSERT INTO P_Members (Party_ID, User_ID, Role)
VALUES (1, 5, 'member');
GO

-- Query F19 (by 24L-3056): Get all members of a specific party (Party_ID = 5)
SELECT pm.Party_ID, pm.User_ID, u.Username, pm.Role, pm.Joined_Date
FROM P_Members pm
JOIN Users u ON pm.User_ID = u.User_ID
WHERE pm.Party_ID = 5;
GO

-- Query F25 (by 24L-3056): Users who have BOTH reviewed AND joined a party (INTERSECT)
SELECT User_ID FROM Activity  WHERE Action_Type = 'REVIEW'
INTERSECT
SELECT User_ID FROM P_Members;
GO


-- =============================================================
-- UC-23: Close Watch Party
-- Actor: Premium User (Host only)
-- Tables: Parties
-- Description: Set Is_Active = 0 — only host can do this.
-- =============================================================

-- DML: Close a party (backend verifies role = 'host' before running this)
UPDATE Parties
SET Is_Active = 0
WHERE Party_ID = 1;
GO


-- =============================================================
-- UC-24: Ban or Unban User
-- Actor: Admin
-- Tables: Users, Activity
-- Description: Set is_banned and is_valid flags, log the action.
-- =============================================================

-- STORED PROCEDURE (sp_BanUser)
-- Handles both ban and unban with a single @banStatus parameter
CREATE PROCEDURE sp_BanUser
    @userId    INT,
    @banStatus BIT       -- 1 = ban, 0 = unban
AS
BEGIN
    UPDATE Users
    SET is_banned = @banStatus,
        is_valid  = CASE WHEN @banStatus = 1 THEN 0 ELSE 1 END
    WHERE User_ID = @userId;

    DECLARE @actionType VARCHAR(50) = CASE WHEN @banStatus = 1 THEN 'BAN' ELSE 'UNBAN' END;

    INSERT INTO Activity (User_ID, Action_Type, Entity_type, Entity_ID, Details)
    VALUES (NULL, @actionType, 'User', @userId, 'Admin changed user ban status');
END;
GO

-- DML: Manual ban (Query 5 by 24L-0616)
UPDATE Users
SET is_banned = 1,
    is_valid  = 0
WHERE User_ID = 3;
GO


-- =============================================================
-- UC-25: Add or Edit Movie Entry
-- Actor: Admin
-- Tables: Movies, M_Genres, M_Cast
-- Description: Insert or update a movie with genres and cast.
-- =============================================================

-- STORED PROCEDURE (sp_AddMovieWithDetails)
-- Inserts movie, then bulk-inserts genres and cast from comma-separated strings
CREATE PROCEDURE sp_AddMovieWithDetails
    @title       VARCHAR(200),
    @mType       VARCHAR(10),
    @releaseDate DATE,
    @runtime     INT,
    @synopsis    VARCHAR(1024),
    @mLanguage   VARCHAR(50),
    @posterUrl   VARCHAR(255),
    @trailerUrl  VARCHAR(255),
    @genreIds    VARCHAR(MAX),   -- e.g. '1,3,4'
    @castIds     VARCHAR(MAX),   -- e.g. '2,5,7'
    @newMovieId  INT OUTPUT
AS
BEGIN
    INSERT INTO Movies (Title, M_Type, Release_date, Runtime, Synopsis,
                        M_Language, Poster_URL, Trailer_URL)
    VALUES (@title, @mType, @releaseDate, @runtime, @synopsis,
            @mLanguage, @posterUrl, @trailerUrl);

    SET @newMovieId = SCOPE_IDENTITY();

    IF @genreIds IS NOT NULL AND @genreIds <> ''
    BEGIN
        INSERT INTO M_Genres (M_ID, G_ID)
        SELECT @newMovieId, CAST(value AS INT)
        FROM STRING_SPLIT(@genreIds, ',');
    END

    IF @castIds IS NOT NULL AND @castIds <> ''
    BEGIN
        INSERT INTO M_Cast (M_ID, P_ID, Role_Type)
        SELECT @newMovieId, CAST(value AS INT), 'Actor'
        FROM STRING_SPLIT(@castIds, ',');
    END
END;
GO


-- =============================================================
-- END OF FILE
-- Total: 25 Use Cases
-- Omer Farooq   24L-0616 : UC-01, UC-02, UC-10, UC-15, UC-16
-- Azfar Tauqeer 24L-0666 : UC-11, UC-12, UC-14, UC-18, UC-20, UC-07(Q16), UC-02(Q17)
-- Abdullah Saeed 24L-3056: UC-08, UC-13, UC-19, UC-21, UC-22, UC-23
-- Shared/Team   :          UC-03, UC-04, UC-05, UC-06, UC-09, UC-17, UC-24, UC-25
-- =============================================================


-- =============================================================
-- ARTICLES FEATURE — Long-form articles by Cinephile users
-- Requires admin approval before publishing.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: Articles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE Articles (
  Article_ID      INT IDENTITY(1,1) PRIMARY KEY,
  Author_ID       INT NOT NULL,           -- FK → Users.User_ID
  Title           VARCHAR(200) NOT NULL,
  Slug            VARCHAR(220) NOT NULL UNIQUE,  -- URL-friendly title
  Body            TEXT NOT NULL,          -- full article content
  Cover_Image_URL VARCHAR(255) NULL,      -- optional cover image URL
  Status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
                  -- pending | approved | rejected
  Rejection_Note  TEXT NULL,             -- admin reason if rejected
  Movie_ID        INT NULL,              -- FK → Movies (optional)
  Category        VARCHAR(50)  NOT NULL, -- REVIEW | ESSAY | EDITORIAL | ANALYSIS | HOT TAKE
  Created_At      DATETIME DEFAULT GETDATE(),
  Published_At    DATETIME NULL,         -- set when admin approves
  Updated_At      DATETIME DEFAULT GETDATE(),
  View_Count      INT DEFAULT 0,

  CONSTRAINT FK_Articles_Author FOREIGN KEY (Author_ID)
    REFERENCES Users(User_ID),
  CONSTRAINT FK_Articles_Movie  FOREIGN KEY (Movie_ID)
    REFERENCES Movies(Movie_ID),
  CONSTRAINT CHK_Article_Status CHECK (Status IN
    ('pending','approved','rejected'))
);
GO

-- ─────────────────────────────────────────────────────────────
-- STORED PROCEDURE: sp_PublishArticle
-- Called by admin to approve and publish an article.
-- Sets Status = 'approved', records Published_At,
-- and logs the action in the Activity table.
-- ─────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_PublishArticle
    @articleId INT,
    @adminId   INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Articles
    SET Status       = 'approved',
        Published_At = GETDATE(),
        Updated_At   = GETDATE()
    WHERE Article_ID = @articleId;

    INSERT INTO Activity (User_ID, Action_Type, Entity_type, Entity_ID, Details)
    VALUES (@adminId, 'ARTICLE_APPROVED', 'Article', @articleId,
            'Admin approved and published article ID ' + CAST(@articleId AS VARCHAR));
END;
GO

-- ─────────────────────────────────────────────────────────────
-- VIEW: vw_PublishedArticles
-- Returns all approved articles joined with author and movie info.
-- Ordered by most recently published first.
-- ─────────────────────────────────────────────────────────────
CREATE VIEW vw_PublishedArticles AS
SELECT
    a.Article_ID,
    a.Author_ID,
    a.Title,
    a.Slug,
    a.Body,
    a.Cover_Image_URL,
    a.Status,
    a.Movie_ID,
    a.Category,
    a.Created_At,
    a.Published_At,
    a.Updated_At,
    a.View_Count,
    u.Username,
    u.flair_label,
    m.Title AS Movie_Title
FROM Articles a
JOIN Users  u ON a.Author_ID = u.User_ID
LEFT JOIN Movies m ON a.Movie_ID  = m.Movie_ID
WHERE a.Status = 'approved';
GO


-- =============================================================
-- FRIENDS SYSTEM — Friend Requests, Accept SP, Friend List View
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: FriendRequests
-- Tracks pending/accepted/declined friend requests.
-- On acceptance, both directions are written to Friends table.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE FriendRequests (
  Request_ID  INT IDENTITY(1,1) PRIMARY KEY,
  Sender_ID   INT NOT NULL,      -- FK → Users.User_ID
  Receiver_ID INT NOT NULL,      -- FK → Users.User_ID
  Status      VARCHAR(20) NOT NULL DEFAULT 'pending',
              -- pending | accepted | declined
  Created_At  DATETIME DEFAULT GETDATE(),
  Resolved_At DATETIME NULL,

  CONSTRAINT FK_FR_Sender   FOREIGN KEY (Sender_ID)
    REFERENCES Users(User_ID),
  CONSTRAINT FK_FR_Receiver FOREIGN KEY (Receiver_ID)
    REFERENCES Users(User_ID),
  CONSTRAINT CHK_FR_Status  CHECK (Status IN
    ('pending','accepted','declined')),
  CONSTRAINT CHK_FR_NoSelf  CHECK (Sender_ID != Receiver_ID),
  CONSTRAINT UQ_FR_Pair     UNIQUE (Sender_ID, Receiver_ID)
);
GO

-- ─────────────────────────────────────────────────────────────
-- STORED PROCEDURE: sp_AcceptFriendRequest
-- Atomically marks the request accepted and writes both
-- directions into the Friends table.
-- ─────────────────────────────────────────────────────────────
CREATE PROCEDURE sp_AcceptFriendRequest
    @requestId  INT,
    @receiverId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @senderId INT;

    -- Get sender from the validated request row
    SELECT @senderId = Sender_ID
    FROM FriendRequests
    WHERE Request_ID  = @requestId
      AND Receiver_ID = @receiverId
      AND Status      = 'pending';

    IF @senderId IS NULL
    BEGIN
        RAISERROR('Friend request not found or already resolved.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;
    BEGIN TRY
        UPDATE FriendRequests
        SET Status      = 'accepted',
            Resolved_At = GETDATE()
        WHERE Request_ID = @requestId;

        -- Insert both directions (ignore if already exist)
        IF NOT EXISTS (SELECT 1 FROM Friends WHERE U_ID = @senderId AND F_ID = @receiverId)
            INSERT INTO Friends (U_ID, F_ID) VALUES (@senderId, @receiverId);

        IF NOT EXISTS (SELECT 1 FROM Friends WHERE U_ID = @receiverId AND F_ID = @senderId)
            INSERT INTO Friends (U_ID, F_ID) VALUES (@receiverId, @senderId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- ─────────────────────────────────────────────────────────────
-- VIEW: vw_FriendList
-- Returns each user's friends with enriched user fields.
-- ─────────────────────────────────────────────────────────────
CREATE VIEW vw_FriendList AS
SELECT
    F.U_ID               AS User_ID,
    U.Username           AS Friend_Username,
    U.User_ID            AS Friend_ID,
    U.flair_label,
    U.Profile_Pic_URL,
    U.has_premium_flair
FROM Friends F
JOIN Users U ON F.F_ID = U.User_ID;
GO


-- =============================================================
-- ADMIN SYSTEM
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE: Admins
-- ─────────────────────────────────────────────────────────────
CREATE TABLE Admins (
  Admin_ID    INT IDENTITY(1,1) PRIMARY KEY,
  A_Username  VARCHAR(50) NOT NULL UNIQUE,
  A_Password  VARCHAR(255) NOT NULL
);
GO

-- Insert default admin for testing
-- Password is 'Admin@123'
INSERT INTO Admins (A_Username, A_Password) 
VALUES ('cinesocial_admin', '$2b$10$s5Z3qzhC40rCy0hRbmhbfeK9r9nhqrPh.p14P8SpntC2gj8kSS.IO');
GO

-- ─────────────────────────────────────────────────────────────
-- UPDATE: Movie soft deletion (Admin)
-- ─────────────────────────────────────────────────────────────
-- Added to support soft-deleting movies that have foreign key 
-- dependencies (e.g. existing reviews/activity)
-- ALTER TABLE Movies ADD is_hidden BIT DEFAULT 0;
-- GO