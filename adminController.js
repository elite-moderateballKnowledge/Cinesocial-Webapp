const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .query('SELECT * FROM Admins WHERE A_Username = @username');

    const admin = result.recordset[0];
    if (!admin) return res.status(401).json({ message: 'Invalid admin credentials' });

    const isMatch = await bcrypt.compare(password, admin.A_Password);
    if (!isMatch) { 
       return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    const payload = { adminId: admin.Admin_ID, username: admin.A_Username, role: 'admin' };
    const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, admin: { username: admin.A_Username } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.banUser = async (req, res) => {
  const { userId, banStatus } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('banStatus', sql.Bit, banStatus ? 1 : 0)
      .execute('sp_BanUser');
    res.json({ message: 'User ban status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.addMovie = async (req, res) => {
  const { title, mType, releaseDate, runtime, synopsis, mLanguage, posterUrl, trailerUrl, genreIds, castIds } = req.body;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.VarChar, title)
      .input('mType', sql.VarChar, mType || 'Movie')
      .input('releaseDate', sql.Date, releaseDate)
      .input('runtime', sql.Int, runtime)
      .input('synopsis', sql.VarChar, synopsis)
      .input('mLanguage', sql.VarChar, mLanguage)
      .input('posterUrl', sql.VarChar, posterUrl)
      .input('trailerUrl', sql.VarChar, trailerUrl)
      .input('genreIds', sql.VarChar, genreIds ? genreIds.join(',') : '')
      .input('castIds', sql.VarChar, castIds ? castIds.join(',') : '')
      .output('newMovieId', sql.Int)
      .execute('sp_AddMovieWithDetails');
      
    res.status(201).json({ message: 'Movie added successfully', movieId: result.output.newMovieId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCombinedActivity = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Activity_ID, 'REVIEW' AS ActivityType, User_ID, Time_stamp FROM Activity WHERE Action_Type = 'REVIEW'
      UNION ALL
      SELECT NULL AS Activity_ID, 'JOIN_PARTY' AS ActivityType, User_ID, Joined_Date AS Time_stamp FROM P_Members
      ORDER BY Time_stamp DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSystemReport = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.Username, s.Plan_Name
      FROM Users u
      FULL OUTER JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users) AS total_users,
        (SELECT COUNT(*) FROM Users WHERE is_valid = 1 AND is_banned = 0) AS active_users,
        (SELECT COUNT(*) FROM Users WHERE is_banned = 1) AS banned_users,
        (SELECT COUNT(*) FROM Users u LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID WHERE s.Plan_Name = 'Cinephile') AS cinephile_users,
        (SELECT COUNT(*) FROM Movies) AS total_movies,
        (SELECT COUNT(*) FROM Activity WHERE action_type='REVIEW') AS total_reviews,
        (SELECT COUNT(*) FROM Articles) AS total_articles,
        (SELECT COUNT(*) FROM Articles WHERE Status = 'pending') AS pending_articles,
        (SELECT COUNT(*) FROM Parties) AS total_parties,
        (SELECT COUNT(*) FROM Users WHERE Join_date >= DATEADD(day,-7,GETDATE())) AS new_users_this_week
    `);
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const pool = await poolPromise;

    // Get total count for pagination
    const countResult = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .query(`
        SELECT COUNT(*) as total FROM Users
        WHERE Username LIKE @search OR Email LIKE @search
      `);
    const total = countResult.recordset[0].total;
    const totalPages = Math.ceil(total / limit);

    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT u.User_ID as user_id, u.Username as username, u.Email as email, u.Join_date as join_date,
               u.is_valid, u.is_banned, s.Plan_Name as plan_name,
               (SELECT COUNT(*) FROM Activity WHERE User_ID = u.User_ID AND Action_Type='REVIEW') AS review_count,
               (SELECT COUNT(*) FROM Articles WHERE Author_ID = u.User_ID) AS article_count
        FROM Users u
        LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
        WHERE u.Username LIKE @search OR u.Email LIKE @search
        ORDER BY u.Join_date DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
      
    res.json({ users: result.recordset, totalPages, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// UC-24: Ban user by ID via sp_BanUser
exports.banUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, id)
      .input('banStatus', sql.Bit, 1)
      .execute('sp_BanUser');
      
    res.json({ message: 'User banned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error banning user' });
  }
};

// UC-24: Unban user by ID via sp_BanUser
exports.unbanUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, id)
      .input('banStatus', sql.Bit, 0)
      .execute('sp_BanUser');
      
    res.json({ message: 'User unbanned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error unbanning user' });
  }
};

exports.deleteReview = async (req, res) => {
  const { activityId } = req.params;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('activityId', sql.Int, activityId)
      .query("DELETE FROM Activity WHERE Activity_ID=@activityId AND Action_Type='REVIEW'");
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting review' });
  }
};

exports.getMovies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    const pool = await poolPromise;
    const result = await pool.request()
      .input('search', sql.VarChar, `%${search}%`)
      .input('offset', sql.Int, offset)
      .input('limit', sql.Int, limit)
      .query(`
        SELECT Movie_ID, Title, M_Type, Release_date, Runtime, Synopsis, M_Language, Poster_URL, Trailer_URL, A_Rating
        FROM Movies
        WHERE Title LIKE @search
        ORDER BY Release_date DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching movies' });
  }
};

exports.updateMovie = async (req, res) => {
  const { id } = req.params;
  const { title, mType, releaseDate, runtime, synopsis, mLanguage, posterUrl, trailerUrl } = req.body;
  try {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('title', sql.VarChar, title)
      .input('mType', sql.VarChar, mType || 'Movie')
      .input('releaseDate', sql.Date, releaseDate)
      .input('runtime', sql.Int, runtime)
      .input('synopsis', sql.VarChar, synopsis)
      .input('mLanguage', sql.VarChar, mLanguage)
      .input('posterUrl', sql.VarChar, posterUrl)
      .input('trailerUrl', sql.VarChar, trailerUrl)
      .query(`
        UPDATE Movies SET 
          Title=COALESCE(@title, Title), 
          M_Type=COALESCE(@mType, M_Type), 
          Release_date=COALESCE(@releaseDate, Release_date), 
          Runtime=COALESCE(@runtime, Runtime), 
          Synopsis=COALESCE(@synopsis, Synopsis), 
          M_Language=COALESCE(@mLanguage, M_Language), 
          Poster_URL=COALESCE(@posterUrl, Poster_URL), 
          Trailer_URL=COALESCE(@trailerUrl, Trailer_URL)
        WHERE Movie_ID=@id
      `);
    res.json({ message: 'Movie updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating movie' });
  }
};

exports.deleteMovie = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await poolPromise;
    
    // Check FK dependencies in Activity and Parties
    const fkCheck = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Activity WHERE Movie_ID=@id) +
          (SELECT COUNT(*) FROM Parties WHERE Movie_ID=@id) as count
      `);
      
    if (fkCheck.recordset[0].count > 0) {
      // Soft delete
      try {
        await pool.request()
          .query("ALTER TABLE Movies ADD is_hidden BIT DEFAULT 0");
      } catch (e) {
        // ignore if already exists
      }
      await pool.request()
        .input('id', sql.Int, id)
        .query("UPDATE Movies SET is_hidden=1 WHERE Movie_ID=@id");
      res.json({ message: 'Movie soft deleted (hidden) due to existing dependencies' });
    } else {
      // Hard delete
      await pool.request().input('id', sql.Int, id).query("DELETE FROM M_Genres WHERE M_ID=@id");
      await pool.request().input('id', sql.Int, id).query("DELETE FROM M_Cast WHERE M_ID=@id");
      await pool.request().input('id', sql.Int, id).query("DELETE FROM ListMovies WHERE M_ID=@id");
      await pool.request().input('id', sql.Int, id).query("UPDATE Movies SET Sequel_of = NULL WHERE Sequel_of=@id");
      await pool.request().input('id', sql.Int, id).query("DELETE FROM Movies WHERE Movie_ID=@id");
      res.json({ message: 'Movie hard deleted' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting movie' });
  }
};

// UC-22 (F25): Users who have BOTH reviewed AND joined a party (INTERSECT)
exports.getReviewersInParties = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT User_ID FROM Activity WHERE Action_Type = 'REVIEW'
      INTERSECT
      SELECT User_ID FROM P_Members
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-08 (F20): Get all users with expired subscriptions
exports.getExpiredSubscriptions = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT u.User_ID, u.Username, u.Email, u.sub_exp
      FROM Users u
      LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
      WHERE u.sub_exp < GETDATE()
        AND u.sub_ID IS NOT NULL
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
