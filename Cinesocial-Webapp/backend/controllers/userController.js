const { poolPromise, sql } = require('../config/db');

exports.getProfile = async (req, res) => {
  const isMe = !req.params.id || req.params.id === 'me';
  const userId = isMe ? req.user.userId : req.params.id;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT *
        FROM vw_UserProfile
        WHERE user_id = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.recordset[0];
    
    // e) Friendship status if not me and logged in
    user.friendship_status = 'none';
    user.incoming_request_id = null;
    if (!isMe && req.user && req.user.userId) {
      const myId = req.user.userId;
      const statusCheck = await pool.request()
        .input('myId', sql.Int, myId)
        .input('theirId', sql.Int, userId)
        .query(`
          SELECT
            CASE
              WHEN EXISTS (SELECT 1 FROM Friends WHERE U_ID = @myId AND F_ID = @theirId) THEN 'friends'
              WHEN EXISTS (SELECT 1 FROM FriendRequests WHERE Sender_ID = @myId AND Receiver_ID = @theirId AND Status = 'pending') THEN 'pending_sent'
              WHEN EXISTS (SELECT 1 FROM FriendRequests WHERE Sender_ID = @theirId AND Receiver_ID = @myId AND Status = 'pending') THEN 'pending_received'
              ELSE 'none'
            END AS friendship_status,
            (SELECT TOP 1 Request_ID FROM FriendRequests WHERE Sender_ID = @theirId AND Receiver_ID = @myId AND Status = 'pending') AS incoming_request_id
        `);
      
      if (statusCheck.recordset.length > 0) {
        user.friendship_status = statusCheck.recordset[0].friendship_status;
        user.incoming_request_id = statusCheck.recordset[0].incoming_request_id;
      }
    }
    
    // a) Reviews written
    const reviewsReq = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT a.Activity_ID, a.Rating, a.Review_text, a.Time_stamp, m.Movie_ID, m.Title, m.Poster_URL
        FROM Activity a
        JOIN Movies m ON a.Movie_ID = m.Movie_ID
        WHERE a.User_ID = @userId AND a.Action_Type = 'REVIEW'
        ORDER BY a.Time_stamp DESC
      `);
    user.reviews = reviewsReq.recordset;

    // b) Lists
    const isPublicOnly = !isMe;
    let listsQuery = `
      SELECT l.List_ID, l.List_Title, l.L_Description, l.is_watchlist, l.is_public,
             (SELECT COUNT(*) FROM ListMovies lm WHERE lm.L_ID = l.List_ID) AS movie_count
      FROM Lists l
      WHERE l.U_ID = @userId
    `;
    if (isPublicOnly) {
      listsQuery += ` AND l.is_public = 1`;
    }
    const listsReq = await pool.request()
      .input('userId', sql.Int, userId)
      .query(listsQuery);
    user.lists = listsReq.recordset;

    // c) Friends
    const friendsReq = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.User_ID, u.Username, u.Profile_Pic_URL, u.flair_label
        FROM Friends f
        JOIN Users u ON f.F_ID = u.User_ID
        WHERE f.U_ID = @userId
      `);
    user.friends = friendsReq.recordset;

    // d) Parties attended
    const partiesReq = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT p.Party_ID, p.Party_Name, p.Is_Active, m.Movie_ID, m.Title, pm.Role
        FROM P_Members pm
        JOIN Parties p ON pm.Party_ID = p.Party_ID
        JOIN Movies m ON p.Movie_ID = m.Movie_ID
        WHERE pm.User_ID = @userId
      `);
    user.parties_attended = partiesReq.recordset;

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { bio, flairLabel, profilePicUrl } = req.body;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    
    // Check flair gate
    if (flairLabel) {
      const subCheck = await pool.request()
        .input('userId', sql.Int, userId)
        .query(`
          SELECT s.Has_Profile_Flair 
          FROM Users u
          LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
          WHERE u.User_ID = @userId AND u.sub_exp > GETDATE()
        `);
      
      if (subCheck.recordset.length === 0 || !subCheck.recordset[0].Has_Profile_Flair) {
        return res.status(403).json({ message: 'Premium feature: You cannot set a profile flair.' });
      }
    }

    await pool.request()
      .input('bio', sql.VarChar(sql.MAX), bio || null)
      .input('flairLabel', sql.VarChar, flairLabel || null)
      .input('pic', sql.VarChar, profilePicUrl || null)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Users 
        SET Bio = ISNULL(@bio, CAST(Bio AS VARCHAR(MAX))),
            flair_label = ISNULL(@flairLabel, flair_label),
            Profile_Pic_URL = ISNULL(@pic, Profile_Pic_URL)
        WHERE User_ID = @userId
      `);

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getRecentMembers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT TOP 50 User_ID, Username, flair_label, Profile_Pic_URL, Join_date
        FROM Users
        WHERE is_valid = 1
        ORDER BY Join_date DESC, User_ID DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getRecentMembers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateGenrePreferences = async (req, res) => {
  const { genreIds } = req.body;
  const userId = req.user.userId;

  if (!Array.isArray(genreIds)) {
    return res.status(400).json({ message: 'genreIds must be an array' });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // UC-05: DELETE old preferences
      await transaction.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM UserGenres WHERE User_ID = @userId');

      // UC-05: INSERT new ones
      for (const gId of genreIds) {
        await transaction.request()
          .input('userId', sql.Int, userId)
          .input('gId', sql.Int, gId)
          .query('INSERT INTO UserGenres (User_ID, G_ID) VALUES (@userId, @gId)');
      }

      await transaction.commit();
      res.json({ message: 'Genre preferences updated successfully' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Favourite Movies ────────────────────────────────────────────────────────
exports.getFavouriteMovies = async (req, res) => {
  const userId = req.params.id;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT uf.Rank, m.Movie_ID, m.Title, m.Poster_URL, m.A_Rating, m.Release_date
        FROM UserFavorites uf
        JOIN Movies m ON uf.M_ID = m.Movie_ID
        WHERE uf.U_ID = @userId
        ORDER BY uf.Rank ASC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('getFavouriteMovies:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT: set (replace) the logged-in user's 3 favourite movies
// expects body: { favourites: [{ movieId, rank }] }  — rank is 1, 2, or 3
exports.setFavouriteMovies = async (req, res) => {
  const userId = req.user.userId;
  const { favourites } = req.body;

  // Validate — ISP: only check what this function cares about
  if (!Array.isArray(favourites) || favourites.length > 3) {
    return res.status(400).json({ message: 'favourites must be an array of up to 3 items.' });
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // Wipe existing favourites first
      await transaction.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM UserFavorites WHERE U_ID = @userId');

      // Insert each one — OCP: adding a 4th favourite later only changes this loop limit
      for (const { movieId, rank } of favourites) {
        await transaction.request()
          .input('userId', sql.Int, userId)
          .input('movieId', sql.Int, movieId)
          .input('rank', sql.Int, rank)
          .query(`
            INSERT INTO UserFavorites (U_ID, M_ID, Rank)
            VALUES (@userId, @movieId, @rank)
          `);
      }

      await transaction.commit();
      res.json({ message: 'Favourite movies updated.' });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error('setFavouriteMovies:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── Mutual Friends ───────────────────────────────────────────────────────────

// GET: returns friends that both the logged-in user and the target user share
exports.getMutualFriends = async (req, res) => {
  const myId = req.user.userId;        // comes from verifyToken (Proxy pattern)
  const theirId = req.params.id;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('myId', sql.Int, myId)
      .input('theirId', sql.Int, theirId)
      .query(`
        SELECT u.User_ID, u.Username, u.Profile_Pic_URL, u.flair_label
        FROM Friends f1
        JOIN Friends f2 ON f1.F_ID = f2.F_ID
        JOIN Users u   ON f1.F_ID  = u.User_ID
        WHERE f1.U_ID = @myId
          AND f2.U_ID = @theirId
          AND u.is_valid = 1
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('getMutualFriends:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
