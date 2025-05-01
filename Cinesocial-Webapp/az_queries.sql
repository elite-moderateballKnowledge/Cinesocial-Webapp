-- OMer work here onwards:
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

-- Azfar work here onwards:
--24L-0666

--10
SELECT * 
FROM Movies 
WHERE Title LIKE '%a%'

--11
SELECT *
FROM Movies JOIN M_Genres g1 ON Movie_ID=g1.M_ID JOIN Genres g2 ON g1.G_ID=g2.G_ID
WHERE g1.G_ID=2

--12
SELECT Full_Name, Role_Type, Character_Name
FROM M_Cast JOIN Movies ON M_ID=Movie_ID JOIN Persons ON P_ID=Person_ID
WHERE Movie_ID=3

--13
SELECT m.Movie_ID, m.Title
FROM Movies m JOIN Activity a ON m.Movie_ID=a.Movie_ID
GROUP BY m.Movie_ID, m.Title
HAVING COUNT(a.Rating) > 10 -- N = 10

--14
SELECT *
FROM (((Movies m JOIN ListMovies l1 ON m.Movie_ID=l1.M_ID) JOIN Lists l2 ON l1.L_ID=l2.List_ID) JOIN Users u ON l2.U_ID=u.User_ID)
WHERE l2.is_watchlist=1 AND u.User_ID=1

--15
SELECT *
FROM Friends f JOIN Users u ON f.F_ID=u.User_ID
WHERE f.U_ID=6

--16
SELECT *
FROM Users u JOIN Subscriptions s ON u.sub_ID=s.Subscription_ID
WHERE u.sub_ID IS NOT NULL AND u.sub_exp > GETDATE()

--17
SELECT * 
FROM Movies
ORDER BY Release_date DESC

-- ABD work here onwards: 
--24L-3056


-- F18
SELECT p.Party_ID, p.Party_Name, u.Username AS host, m.Title AS movie, p.Max_Members, p.Is_Active
FROM Parties p
JOIN Users u ON p.Created_By = u.User_ID
JOIN Movies m ON p.Movie_ID = m.Movie_ID
WHERE p.Is_Active = 1


-- F19
SELECT pm.Party_ID, pm.User_ID, u.Username, pm.Role, pm.Joined_Date
FROM P_Members pm
JOIN Users u ON pm.User_ID = u.User_ID
WHERE pm.Party_ID = 5


-- F20
SELECT u.User_ID, u.Username, u.Email, u.sub_exp
FROM Users u
LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
WHERE u.sub_exp < GETDATE() AND u.sub_ID IS NOT NULL


-- F21
SELECT l.List_ID, l.List_Title, u.Username, COUNT(lm.M_ID) AS total_movies
FROM Lists l
JOIN Users u ON l.U_ID = u.User_ID
LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
WHERE l.is_watchlist = 0 AND l.is_public = 1
GROUP BY l.List_ID, l.List_Title, u.Username
ORDER BY total_movies DESC


-- F22
SELECT m.Movie_ID, m.Title, m.A_Rating
FROM Movies m
LEFT JOIN Activity a ON m.Movie_ID = a.Movie_ID AND a.Action_Type = 'REVIEW'
WHERE a.Activity_ID IS NULL


-- F23
SELECT Movie_ID, Title, A_Rating
FROM Movies
WHERE A_Rating = (SELECT MAX(A_Rating) FROM Movies)


-- F24
SELECT m.Movie_ID, m.Title
FROM Movies m
JOIN M_Genres mg ON m.Movie_ID = mg.M_ID
WHERE mg.G_ID IN (SELECT G_ID FROM M_Genres WHERE M_ID IN (SELECT M_ID FROM M_Genres))
EXCEPT
SELECT m.Movie_ID, m.Title
FROM Movies m
WHERE m.Movie_ID IN (SELECT M_ID FROM ListMovies)


-- F25 (INTERSECT)
SELECT User_ID FROM Activity WHERE Action_Type = 'REVIEW'
INTERSECT
SELECT User_ID FROM P_Members