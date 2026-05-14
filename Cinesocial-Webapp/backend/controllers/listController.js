const { poolPromise, sql } = require('../config/db');
const { normalizeMoviePosters } = require('../utils/mediaAssets');

// Helper to get or create watchlist
const getOrCreateWatchlist = async (pool, userId) => {
  const result = await pool.request()
    .input('userId', sql.Int, userId)
    .query('SELECT List_ID FROM Lists WHERE U_ID = @userId AND is_watchlist = 1');
    
  if (result.recordset.length > 0) {
    return result.recordset[0].List_ID;
  }
  
  const insertResult = await pool.request()
    .input('userId', sql.Int, userId)
    .query('INSERT INTO Lists (U_ID, List_Title, is_watchlist, is_public) OUTPUT INSERTED.List_ID VALUES (@userId, \'Watchlist\', 1, 0)');
    
  return insertResult.recordset[0].List_ID;
};

// UC-18 (Q14): Get watchlist movies for current user
exports.getWatchlist = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pool = await poolPromise;
    const listId = await getOrCreateWatchlist(pool, userId);
    
    const movies = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT *
        FROM Movies m
        JOIN ListMovies l1 ON m.Movie_ID = l1.M_ID
        JOIN Lists      l2 ON l1.L_ID   = l2.List_ID
        JOIN Users       u ON l2.U_ID   = u.User_ID
        WHERE l2.is_watchlist = 1
          AND u.User_ID       = @userId
      `);
      
    res.json(movies.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addToWatchlist = async (req, res) => {
  const { movieId } = req.body;
  const userId = req.user.userId;
  
  try {
    const pool = await poolPromise;
    const listId = await getOrCreateWatchlist(pool, userId);
    
    // Check if already in watchlist
    const check = await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .query('SELECT * FROM ListMovies WHERE L_ID = @listId AND M_ID = @movieId');
      
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Movie already in watchlist' });
    }
    
    await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .query('INSERT INTO ListMovies (L_ID, M_ID, Watch_status) VALUES (@listId, @movieId, \'pending\')');
      
    res.json({ message: 'Added to watchlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserLists = async (req, res) => {
  const userId = req.params.id || req.user.userId;
  const ownerView = !req.params.id;
  
  try {
    const pool = await poolPromise;
    const lists = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          l.List_ID,
          l.List_Title,
          CAST(l.L_Description AS NVARCHAR(MAX)) as L_Description,
          l.is_watchlist,
          l.is_public,
          l.Created_Date,
          COUNT(lm.M_ID) as total_movies
        FROM Lists l
        LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
        WHERE l.U_ID = @userId
          ${ownerView ? '' : 'AND l.is_public = 1 AND l.is_watchlist = 0'}
        GROUP BY
          l.List_ID,
          l.List_Title,
          CAST(l.L_Description AS NVARCHAR(MAX)),
          l.is_watchlist,
          l.is_public,
          l.Created_Date
        ORDER BY l.is_watchlist DESC, l.Created_Date DESC, l.List_ID DESC
      `);
      
    res.json(lists.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-19: Get public lists via vw_PublicLists
exports.getPublicLists = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT
          l.List_ID,
          l.List_Title,
          CAST(l.L_Description AS NVARCHAR(MAX)) AS L_Description,
          u.User_ID,
          u.Username,
          COUNT(lm.M_ID) AS total_movies,
          l.Created_Date,
          l.is_public,
          l.is_watchlist
        FROM Lists l
        JOIN Users u ON l.U_ID = u.User_ID
        LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
        WHERE l.is_public = 1
          AND l.is_watchlist = 0
        GROUP BY
          l.List_ID,
          l.List_Title,
          CAST(l.L_Description AS NVARCHAR(MAX)),
          u.User_ID,
          u.Username,
          l.Created_Date,
          l.is_public,
          l.is_watchlist
        ORDER BY total_movies DESC, l.Created_Date DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createList = async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.userId;

  if (!title || title.trim() === '') {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    const pool = await poolPromise;

    // Enforce 3-list limit for Basic users
    const subCheck = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.sub_ID, 
               (SELECT COUNT(*) FROM Lists WHERE U_ID = @userId AND is_watchlist = 0) as list_count
        FROM Users u 
        WHERE u.User_ID = @userId
      `);
      
    if (subCheck.recordset.length > 0) {
      const userStatus = subCheck.recordset[0];
      if ((!userStatus.sub_ID || userStatus.sub_ID === 1) && userStatus.list_count >= 3) {
         return res.status(403).json({ message: 'Basic plan is limited to 3 custom lists. Please upgrade to Cinephile.' });
      }
    }

    const insertResult = await pool.request()
      .input('userId', sql.Int, userId)
      .input('title', sql.VarChar, title.trim())
      .input('desc', sql.Text, description || null)
      .input('public', sql.Bit, 1)
      .input('watchlist', sql.Bit, 0)
      .query(`
        INSERT INTO Lists (U_ID, List_Title, L_Description, is_watchlist, is_public)
        OUTPUT INSERTED.List_ID
        VALUES (@userId, @title, @desc, @watchlist, @public)
      `);

    const listId = insertResult.recordset[0].List_ID;
    const created = await pool.request()
      .input('listId', sql.Int, listId)
      .query(`
        SELECT
          l.List_ID,
          l.List_Title,
          CAST(l.L_Description AS NVARCHAR(MAX)) AS L_Description,
          l.is_watchlist,
          l.is_public,
          l.Created_Date,
          u.User_ID,
          u.Username,
          0 AS total_movies
        FROM Lists l
        JOIN Users u ON l.U_ID = u.User_ID
        WHERE l.List_ID = @listId
      `);

    res.status(201).json(created.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getListById = async (req, res) => {
  const listId = Number.parseInt(req.params.id, 10);
  const requesterId = req.user?.userId || null;

  if (!Number.isInteger(listId)) {
    return res.status(400).json({ message: 'List id must be valid.' });
  }

  try {
    const pool = await poolPromise;
    const request = pool.request()
      .input('listId', sql.Int, listId)
      .input('requesterId', sql.Int, requesterId);

    const listResult = await request.query(`
      SELECT
        l.List_ID,
        l.List_Title,
        CAST(l.L_Description AS NVARCHAR(MAX)) AS L_Description,
        l.is_watchlist,
        l.is_public,
        l.Created_Date,
        l.U_ID,
        u.Username,
        COUNT(lm.M_ID) AS total_movies,
        CASE WHEN @requesterId IS NOT NULL AND l.U_ID = @requesterId THEN 1 ELSE 0 END AS can_edit
      FROM Lists l
      JOIN Users u ON l.U_ID = u.User_ID
      LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
      WHERE l.List_ID = @listId
        AND (
          (l.is_public = 1 AND l.is_watchlist = 0)
          OR (@requesterId IS NOT NULL AND l.U_ID = @requesterId)
        )
      GROUP BY
        l.List_ID,
        l.List_Title,
        CAST(l.L_Description AS NVARCHAR(MAX)),
        l.is_watchlist,
        l.is_public,
        l.Created_Date,
        l.U_ID,
        u.Username
    `);

    if (listResult.recordset.length === 0) {
      return res.status(404).json({ message: 'List not found or not public.' });
    }

    const moviesResult = await pool.request()
      .input('listId', sql.Int, listId)
      .query(`
        SELECT
          m.Movie_ID,
          m.Title,
          m.M_Type,
          m.Release_date,
          m.A_Rating,
          m.Poster_URL,
          lm.Watch_status,
          lm.Edit_Date
        FROM ListMovies lm
        JOIN Movies m ON lm.M_ID = m.Movie_ID
        WHERE lm.L_ID = @listId
        ORDER BY lm.Edit_Date DESC, m.Title ASC
      `);

    res.json({
      ...listResult.recordset[0],
      movies: normalizeMoviePosters(moviesResult.recordset),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMovieToList = async (req, res) => {
  const listId = Number.parseInt(req.params.id, 10);
  const movieId = Number.parseInt(req.body.movieId, 10);
  const userId = req.user.userId;

  if (!Number.isInteger(listId) || !Number.isInteger(movieId)) {
    return res.status(400).json({ message: 'List and movie ids must be valid.' });
  }

  try {
    const pool = await poolPromise;
    const ownerResult = await pool.request()
      .input('listId', sql.Int, listId)
      .input('userId', sql.Int, userId)
      .query('SELECT is_watchlist FROM Lists WHERE List_ID = @listId AND U_ID = @userId');

    if (ownerResult.recordset.length === 0) {
      return res.status(403).json({ message: 'You can only edit your own lists.' });
    }

    const movieResult = await pool.request()
      .input('movieId', sql.Int, movieId)
      .query('SELECT Movie_ID FROM Movies WHERE Movie_ID = @movieId');

    if (movieResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Movie not found.' });
    }

    const duplicate = await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .query('SELECT 1 FROM ListMovies WHERE L_ID = @listId AND M_ID = @movieId');

    if (duplicate.recordset.length > 0) {
      return res.status(400).json({ message: 'Movie is already in this list.' });
    }

    await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .input('watchStatus', sql.VarChar, ownerResult.recordset[0].is_watchlist ? 'pending' : null)
      .query('INSERT INTO ListMovies (L_ID, M_ID, Watch_status) VALUES (@listId, @movieId, @watchStatus)');

    const inserted = await pool.request()
      .input('movieId', sql.Int, movieId)
      .query(`
        SELECT Movie_ID, Title, M_Type, Release_date, A_Rating, Poster_URL
        FROM Movies
        WHERE Movie_ID = @movieId
      `);

    res.status(201).json(normalizeMoviePosters(inserted.recordset)[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.removeMovieFromList = async (req, res) => {
  const listId = Number.parseInt(req.params.id, 10);
  const movieId = Number.parseInt(req.params.movieId, 10);
  const userId = req.user.userId;

  if (!Number.isInteger(listId) || !Number.isInteger(movieId)) {
    return res.status(400).json({ message: 'List and movie ids must be valid.' });
  }

  try {
    const pool = await poolPromise;
    const ownerResult = await pool.request()
      .input('listId', sql.Int, listId)
      .input('userId', sql.Int, userId)
      .query('SELECT 1 FROM Lists WHERE List_ID = @listId AND U_ID = @userId');

    if (ownerResult.recordset.length === 0) {
      return res.status(403).json({ message: 'You can only edit your own lists.' });
    }

    await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .query('DELETE FROM ListMovies WHERE L_ID = @listId AND M_ID = @movieId');

    res.json({ message: 'Movie removed from list.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-18: Update watch status
exports.updateWatchStatus = async (req, res) => {
  const { movieId, status } = req.body;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    const listId = await getOrCreateWatchlist(pool, userId);

    await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .input('status', sql.VarChar, status)
      .query(`
        UPDATE ListMovies
        SET Watch_status = @status
        WHERE L_ID = @listId AND M_ID = @movieId
      `);

    res.json({ message: 'Watch status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-18: Remove movie from watchlist
exports.removeFromWatchlist = async (req, res) => {
  const { movieId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    const listId = await getOrCreateWatchlist(pool, userId);

    await pool.request()
      .input('listId', sql.Int, listId)
      .input('movieId', sql.Int, movieId)
      .query('DELETE FROM ListMovies WHERE L_ID = @listId AND M_ID = @movieId');

    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-19 (F21): All public curated lists ordered by movie count
exports.getPublicListsRanked = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT l.List_ID, l.List_Title, u.Username, COUNT(lm.M_ID) AS total_movies
      FROM Lists l
      JOIN Users      u  ON l.U_ID    = u.User_ID
      LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
      WHERE l.is_watchlist = 0
        AND l.is_public    = 1
      GROUP BY l.List_ID, l.List_Title, u.Username
      ORDER BY total_movies DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-19 (F24): Movies NOT in any list (EXCEPT)
exports.getMoviesNotInAnyList = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
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
      WHERE m.Movie_ID IN (SELECT M_ID FROM ListMovies)
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
