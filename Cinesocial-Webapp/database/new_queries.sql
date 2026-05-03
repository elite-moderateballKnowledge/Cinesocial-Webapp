-- VIEWS

-- 1. vw_MovieSummary
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
GO

-- 2. vw_UserProfile
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
GO

-- 3. vw_CommunityVerdicts
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
GO

-- 4. vw_ActiveParties
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
GO

-- 5. vw_PublicLists
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
GO

-- STORED PROCEDURES

-- 1. sp_RegisterUser
CREATE PROCEDURE sp_RegisterUser
    @username VARCHAR(50),
    @email VARCHAR(100),
    @password VARCHAR(255)
AS
BEGIN
    INSERT INTO Users (Username, Email, Password_hash) 
    VALUES (@username, @email, @password);
END;
GO

-- 2. sp_SubmitReview
CREATE PROCEDURE sp_SubmitReview
    @userId INT,
    @movieId INT,
    @rating DECIMAL(3, 1),
    @reviewText TEXT,
    @ip VARCHAR(45),
    @spoiler BIT
AS
BEGIN
    INSERT INTO Activity (User_ID, Action_Type, Movie_ID, Rating, Review_text, Entity_type, Entity_ID, IP_Address, Contains_spoiler, Is_pinned)
    VALUES (@userId, 'REVIEW', @movieId, @rating, @reviewText, 'Movie', @movieId, @ip, @spoiler, 0);

    DECLARE @newAvg DECIMAL(3, 1);
    SELECT @newAvg = AVG(Rating) FROM Activity WHERE Movie_ID = @movieId AND Action_Type = 'REVIEW';
    
    UPDATE Movies SET A_Rating = @newAvg WHERE Movie_ID = @movieId;
END;
GO

-- 3. sp_BanUser
CREATE PROCEDURE sp_BanUser
    @userId INT,
    @banStatus BIT
AS
BEGIN
    UPDATE Users 
    SET is_banned = @banStatus, is_valid = CASE WHEN @banStatus = 1 THEN 0 ELSE 1 END 
    WHERE User_ID = @userId;

    DECLARE @actionType VARCHAR(50) = CASE WHEN @banStatus = 1 THEN 'BAN' ELSE 'UNBAN' END;
    INSERT INTO Activity (User_ID, Action_Type, Entity_type, Entity_ID, Details)
    VALUES (NULL, @actionType, 'User', @userId, 'Admin changed user ban status');
END;
GO

-- 4. sp_UpgradeToPremium
CREATE PROCEDURE sp_UpgradeToPremium
    @userId INT,
    @planId INT,
    @duration INT
AS
BEGIN
    DECLARE @endDate DATETIME = DATEADD(day, @duration, GETDATE());

    UPDATE Users 
    SET sub_ID = @planId, sub_exp = @endDate
    WHERE User_ID = @userId;

    INSERT INTO SubHistory (User_ID, Subscription_ID, Start_Date, End_Date, Payment_Status)
    VALUES (@userId, @planId, GETDATE(), @endDate, 'Paid');
END;
GO

-- 5. sp_CreateParty
CREATE PROCEDURE sp_CreateParty
    @name VARCHAR(100),
    @createdBy INT,
    @movieId INT,
    @max INT,
    @inviteCode VARCHAR(20),
    @newPartyId INT OUTPUT
AS
BEGIN
    INSERT INTO Parties (Party_Name, Created_By, Movie_ID, Max_Members, Invite_Code, Is_Active)
    VALUES (@name, @createdBy, @movieId, @max, @inviteCode, 1);
    
    SET @newPartyId = SCOPE_IDENTITY();
    
    INSERT INTO P_Members (Party_ID, User_ID, Role) 
    VALUES (@newPartyId, @createdBy, 'host');
END;
GO

-- 6. sp_AddMovieWithDetails
CREATE PROCEDURE sp_AddMovieWithDetails
    @title VARCHAR(200),
    @mType VARCHAR(10),
    @releaseDate DATE,
    @runtime INT,
    @synopsis VARCHAR(1024),
    @mLanguage VARCHAR(50),
    @posterUrl VARCHAR(255),
    @trailerUrl VARCHAR(255),
    @genreIds VARCHAR(MAX),
    @castIds VARCHAR(MAX),
    @newMovieId INT OUTPUT
AS
BEGIN
    INSERT INTO Movies (Title, M_Type, Release_date, Runtime, Synopsis, M_Language, Poster_URL, Trailer_URL)
    VALUES (@title, @mType, @releaseDate, @runtime, @synopsis, @mLanguage, @posterUrl, @trailerUrl);
    
    SET @newMovieId = SCOPE_IDENTITY();

    IF @genreIds IS NOT NULL AND @genreIds <> ''
    BEGIN
        INSERT INTO M_Genres (M_ID, G_ID)
        SELECT @newMovieId, CAST(value AS INT) FROM STRING_SPLIT(@genreIds, ',');
    END

    IF @castIds IS NOT NULL AND @castIds <> ''
    BEGIN
        INSERT INTO M_Cast (M_ID, P_ID, Role_Type)
        SELECT @newMovieId, CAST(value AS INT), 'Actor' FROM STRING_SPLIT(@castIds, ',');
    END
END;
GO
