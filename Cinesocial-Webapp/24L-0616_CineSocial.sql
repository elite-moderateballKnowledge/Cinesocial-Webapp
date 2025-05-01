--24L-0616--
--Query 1--
CREATE PROCEDURE Q1
	@UsersID INT
AS
BEGIN
	UPDATE Users
	SET last_login = CAST(GETDATE())
	WHERE Users.User_ID = @UsersID
	AND is_banned = 0
	AND is_valid = 1;
END;

--Query 2--
INSERT INTO Activity (User_ID, Action_Type, Movie_ID, Rating, Review_text, Entity_type, Entity_ID, IP_Address, Contains_spoiler, Is_pinned, Details)
VALUES(1, 'REVIEW', 6, 5.0, 'GOOD MOVIE', 'Movie', 6, '192.168.1.1', 0, 0, NULL);

--Query 3--
UPDATE Activity
SET Review_text = 'Good'
WHERE User_ID = 1 AND Movie_ID = 2;

--Query 4--
DELETE FROM Activity
WHERE Activity_ID = 1;

--Query 5--
UPDATE Users
SET is_banned = 1, is_valid = 0
WHERE User_ID = 3;

--Query 6--
SELECT * FROM Movies
WHERE A_Rating > 3.0
ORDER BY Movie_ID DESC;

--Query 7--
SELECT DISTINCT(Movie_ID), AVG(Rating) AS Average_rating
FROM Activity
GROUP BY Movie_ID;

--Query 8--
SELECT Movie_ID, COUNT(*) AS No_of_reviews
FROM Activity
WHERE Action_Type = 'REVIEW'
GROUP BY Movie_ID;

--Query 9--
INSERT INTO Users (Username, Email, Password_hash, Bio, Profile_Pic_URL)
VALUES ('new_user', 'newuser@email.com', '$2b$12$somehashedpassword', 'Hey I am new here!', NULL);