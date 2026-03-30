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
