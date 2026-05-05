const { poolPromise, sql } = require('../config/db');
const { normalizeMoviePoster, normalizeMoviePosters, enrichCastPhotos } = require('../utils/mediaAssets');




exports.getAllMovies = async (req, res) => {
  try {
    const pool = await poolPromise;
    let result;

    try {
      result = await pool.request()
        .query('SELECT *, avg_rating AS A_Rating FROM vw_MovieSummary ORDER BY Release_date DESC');
    } catch (viewErr) {
      console.warn('vw_MovieSummary unavailable; falling back to Movies table.', viewErr.message);
      result = await pool.request()
        .query(`
          SELECT Movie_ID, Title, M_Type, Release_date, A_Rating, Runtime, Synopsis, Poster_URL
          FROM Movies
          ORDER BY Release_date DESC
        `);
    }

    res.json(normalizeMoviePosters(result.recordset));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMovieById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    
    // UC-13: Get Movie Details via vw_MovieSummary
    let movieResult = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM vw_MovieSummary WHERE Movie_ID = @id');
      
    if (movieResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const rawMovie = normalizeMoviePoster(movieResult.recordset[0]);
    
    // Get Genres
    const genreResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT g.G_ID, g.G_Name 
        FROM Genres g
        JOIN M_Genres mg ON g.G_ID = mg.G_ID
        WHERE mg.M_ID = @id
      `);
    const genres = genreResult.recordset.map(g => ({ genre_id: g.G_ID, genre_name: g.G_Name }));
    
    // UC-14 (Q12): Get Cast
    const castResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.Person_ID, p.Full_Name, p.Photo_URL, mc.Role_Type, mc.Character_Name
        FROM M_Cast mc
        JOIN Movies ON mc.M_ID = Movie_ID
        JOIN Persons p ON mc.P_ID = p.Person_ID
        WHERE Movie_ID = @id
      `);
    const enrichedCast = castResult.recordset.length > 0 ? await enrichCastPhotos(castResult.recordset) : [];
    const cast = enrichedCast.map(c => ({
      Person_ID: c.Person_ID,
      Full_Name: c.Full_Name,
      Character_Name: c.Character_Name,
      Role_Type: c.Role_Type,
      Photo_URL: c.Photo_URL
    }));
    
    // Get Community Verdicts Count
    const verdictResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT COUNT(*) AS count
        FROM Activity
        WHERE Action_Type = 'REVIEW' AND Movie_ID = @id
      `);
    const review_count = verdictResult.recordset[0].count;

    // UC-13: Get Reviews via vw_CommunityVerdicts
    const reviewsResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT * FROM vw_CommunityVerdicts
        WHERE movie_id = @id
        ORDER BY is_pinned DESC, timestamp DESC
      `);
    const reviews = reviewsResult.recordset;

    const response = {
      movie_id: rawMovie.Movie_ID,
      title: rawMovie.Title,
      type: rawMovie.M_Type,
      release_date: rawMovie.Release_date,
      runtime: rawMovie.Runtime,
      synopsis: rawMovie.Synopsis,
      language: rawMovie.M_Language,
      poster_url: rawMovie.Poster_URL,
      trailer_url: rawMovie.Trailer_URL,
      avg_rating: rawMovie.A_Rating,
      genres,
      cast,
      review_count,
      reviews
    };

    res.json(response);
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
    const trimmed = q.trim();

    const localPromise = pool
      .request()
      .input('query', sql.VarChar, `%${trimmed}%`)
      .query(`
        SELECT DISTINCT m.Movie_ID, m.Title, m.Poster_URL, m.Release_date, m.A_Rating, m.M_Type
        FROM Movies m
        LEFT JOIN M_Cast mc ON m.Movie_ID = mc.M_ID
        LEFT JOIN Persons p ON mc.P_ID = p.Person_ID
        WHERE m.Title LIKE @query
           OR p.Full_Name LIKE @query
      `);

    const localResult = await localPromise;
    res.json(normalizeMoviePosters(localResult.recordset));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPopularByReviews = async (req, res) => {
  const minReviews = req.params.min || 10;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('minReviews', sql.Int, minReviews)
      .query(`
        SELECT m.Movie_ID, m.Title, COUNT(a.Rating) as ReviewCount
        FROM Movies m 
        JOIN Activity a ON m.Movie_ID=a.Movie_ID
        WHERE a.Action_Type = 'REVIEW'
        GROUP BY m.Movie_ID, m.Title
        HAVING COUNT(a.Rating) > @minReviews
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-13 (F22): Movies that have no reviews yet
exports.getUnreviewedMovies = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT m.Movie_ID, m.Title, m.A_Rating
      FROM Movies m
      LEFT JOIN Activity a ON m.Movie_ID = a.Movie_ID
                           AND a.Action_Type = 'REVIEW'
      WHERE a.Activity_ID IS NULL
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-10 (Q6): Fetch movies with rating > 3.0 ordered by newest
exports.getTopRatedMovies = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT * FROM Movies
      WHERE A_Rating > 3.0
      ORDER BY Movie_ID DESC
    `);
    res.json(normalizeMoviePosters(result.recordset));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-12 (Q11): Filter movies by a specific genre
exports.getMoviesByGenre = async (req, res) => {
  const { genreId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('genreId', sql.Int, genreId)
      .query(`
        SELECT *
        FROM Movies
        JOIN M_Genres g1 ON Movie_ID = g1.M_ID
        JOIN Genres   g2 ON g1.G_ID  = g2.G_ID
        WHERE g1.G_ID = @genreId
      `);
    res.json(normalizeMoviePosters(result.recordset));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-13 (Q7): Average rating per movie
exports.getAverageRatings = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT DISTINCT(Movie_ID), AVG(Rating) AS Average_rating
      FROM Activity
      WHERE Action_Type = 'REVIEW'
      GROUP BY Movie_ID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-13 (F23): Movie with the highest rating
exports.getHighestRatedMovie = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Movie_ID, Title, A_Rating
      FROM Movies
      WHERE A_Rating = (SELECT MAX(A_Rating) FROM Movies)
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
