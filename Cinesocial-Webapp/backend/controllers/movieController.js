const { poolPromise, sql } = require('../config/db');

exports.getAllMovies = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT Movie_ID, Title, M_Type, Release_date, Runtime, Synopsis, M_Language, Poster_URL, Trailer_URL, A_Rating FROM Movies ORDER BY Release_date DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMovieById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    
    // Get Movie Details
    const movieResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM Movies WHERE Movie_ID = @id');
      
    if (movieResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    
    const movie = movieResult.recordset[0];
    
    // Get Genres
    const genreResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT g.G_ID, g.G_Name 
        FROM Genres g
        JOIN M_Genres mg ON g.G_ID = mg.G_ID
        WHERE mg.M_ID = @id
      `);
    movie.genres = genreResult.recordset;
    
    // Get Cast
    const castResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.Person_ID, p.Full_Name, p.Photo_URL, mc.Role_Type, mc.Character_Name
        FROM Persons p
        JOIN M_Cast mc ON p.Person_ID = mc.P_ID
        WHERE mc.M_ID = @id
      `);
    movie.cast = castResult.recordset;
    
    // Get Community Verdicts Count
    const verdictResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT COUNT(*) AS count
        FROM Activity
        WHERE Action_Type = 'REVIEW' AND Movie_ID = @id
      `);
    movie.reviewCount = verdictResult.recordset[0].count;

    res.json(movie);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.searchMovies = async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }

  try {
    const pool = await poolPromise;
    // Search by movie title AND actor name AND director name simultaneously via JOINs on MovieCast and Persons
    const result = await pool.request()
      .input('query', sql.VarChar, `%${q}%`)
      .query(`
        SELECT DISTINCT m.Movie_ID, m.Title, m.Poster_URL, m.Release_date, m.A_Rating
        FROM Movies m
        LEFT JOIN M_Cast mc ON m.Movie_ID = mc.M_ID
        LEFT JOIN Persons p ON mc.P_ID = p.Person_ID
        WHERE m.Title LIKE @query 
           OR p.Full_Name LIKE @query
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
