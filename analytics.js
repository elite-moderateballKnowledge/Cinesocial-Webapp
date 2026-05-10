const fs = require('fs');
const { poolPromise } = require('./backend/config/db');

const queries = [
  `CREATE PROCEDURE sp_Analytics_MoviesByActor
      @Offset INT = 0,
      @Limit INT = 20
  AS
  BEGIN
      SELECT 
          p.Person_ID, 
          p.Full_Name AS Actor_Name, 
          COUNT(DISTINCT m.Movie_ID) AS Total_Movies,
          CAST(ISNULL(AVG(m.A_Rating), 0) AS DECIMAL(3,1)) AS Avg_Rating,
          COUNT(a.Activity_ID) AS Total_Reviews
      FROM Persons p
      JOIN M_Cast mc ON p.Person_ID = mc.P_ID
      JOIN Movies m ON mc.M_ID = m.Movie_ID
      LEFT JOIN Activity a ON m.Movie_ID = a.Movie_ID AND a.Action_Type = 'REVIEW'
      WHERE mc.Role_Type IN ('Actor', 'Acting')
      GROUP BY p.Person_ID, p.Full_Name
      ORDER BY Total_Movies DESC, Avg_Rating DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  END;`,
  
  `CREATE PROCEDURE sp_Analytics_MoviesByYear
      @Offset INT = 0,
      @Limit INT = 20
  AS
  BEGIN
      SELECT 
          YEAR(m.Release_date) AS Release_Year, 
          COUNT(DISTINCT m.Movie_ID) AS Total_Movies,
          CAST(ISNULL(AVG(m.A_Rating), 0) AS DECIMAL(3,1)) AS Avg_Rating,
          COUNT(a.Activity_ID) AS Total_Reviews
      FROM Movies m
      LEFT JOIN Activity a ON m.Movie_ID = a.Movie_ID AND a.Action_Type = 'REVIEW'
      WHERE m.Release_date IS NOT NULL
      GROUP BY YEAR(m.Release_date)
      ORDER BY Release_Year DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
  END;`,

  `CREATE PROCEDURE sp_Analytics_MoviesByActor_Count
  AS
  BEGIN
      SELECT COUNT(DISTINCT p.Person_ID) AS Total
      FROM Persons p
      JOIN M_Cast mc ON p.Person_ID = mc.P_ID
      WHERE mc.Role_Type IN ('Actor', 'Acting');
  END;`,

  `CREATE PROCEDURE sp_Analytics_MoviesByYear_Count
  AS
  BEGIN
      SELECT COUNT(DISTINCT YEAR(m.Release_date)) AS Total
      FROM Movies m
      WHERE m.Release_date IS NOT NULL;
  END;`
];

async function run() {
  try {
    const pool = await poolPromise;
    for (let q of queries) {
      try {
        await pool.request().query(q);
        console.log("Successfully created procedure.");
      } catch (err) {
        console.error("Error executing query:", err.message);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("DB connection error:", err);
    process.exit(1);
  }
}

run();
