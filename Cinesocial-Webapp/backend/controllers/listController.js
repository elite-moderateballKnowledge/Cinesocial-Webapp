const { poolPromise, sql } = require('../config/db');

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
    .query('INSERT INTO Lists (U_ID, List_Title, is_watchlist, is_public) OUTPUT INSERTED.List_ID VALUES (@userId, \'My Watchlist\', 1, 0)');
    
  return insertResult.recordset[0].List_ID;
};

exports.getWatchlist = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pool = await poolPromise;
    const listId = await getOrCreateWatchlist(pool, userId);
    
    const movies = await pool.request()
      .input('listId', sql.Int, listId)
      .query(`
        SELECT m.Movie_ID, m.Title, m.Poster_URL, lm.Watch_status
        FROM ListMovies lm
        JOIN Movies m ON lm.M_ID = m.Movie_ID
        WHERE lm.L_ID = @listId
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
  
  try {
    const pool = await poolPromise;
    const lists = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT l.List_ID, l.List_Title, l.L_Description, l.is_watchlist, COUNT(lm.M_ID) as total_movies
        FROM Lists l
        LEFT JOIN ListMovies lm ON l.List_ID = lm.L_ID
        WHERE l.U_ID = @userId
        GROUP BY l.List_ID, l.List_Title, l.L_Description, l.is_watchlist
      `);
      
    res.json(lists.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
