const { poolPromise, sql } = require('../config/db');

exports.addReview = async (req, res) => {
  const { movieId, rating, reviewText, containsSpoiler } = req.body;
  const userId = req.user.userId;

  if (rating < 0.5 || rating > 5.0) {
    return res.status(400).json({ message: 'Rating must be between 0.5 and 5.0' });
  }

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('movieId', sql.Int, movieId)
      .input('rating', sql.Decimal(3, 1), rating)
      .input('reviewText', sql.Text, reviewText)
      .input('spoiler', sql.Bit, containsSpoiler ? 1 : 0)
      .input('ip', sql.VarChar, req.ip)
      .query(`
        INSERT INTO Activity (User_ID, Action_Type, Movie_ID, Rating, Review_text, Entity_type, Entity_ID, IP_Address, Contains_spoiler, Is_pinned)
        VALUES (@userId, 'REVIEW', @movieId, @rating, @reviewText, 'Movie', @movieId, @ip, @spoiler, 0)
      `);
      
    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.pinReview = async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    
    // Check if user has permission
    const subCheck = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT s.Can_Pin_Reviews 
        FROM Users u
        LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
        WHERE u.User_ID = @userId
      `);
      
    if (subCheck.recordset.length === 0 || !subCheck.recordset[0].Can_Pin_Reviews) {
      return res.status(403).json({ message: 'Premium feature: You cannot pin reviews.' });
    }

    await pool.request()
      .input('activityId', sql.Int, activityId)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Activity 
        SET Is_pinned = 1 
        WHERE Activity_ID = @activityId AND User_ID = @userId
      `);

    res.json({ message: 'Review pinned successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMovieReviews = async (req, res) => {
  const { movieId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('movieId', sql.Int, movieId)
      .query(`
        SELECT a.*, u.Username, u.Profile_Pic_URL 
        FROM Activity a
        JOIN Users u ON a.User_ID = u.User_ID
        WHERE a.Action_Type = 'REVIEW' AND a.Movie_ID = @movieId
        ORDER BY a.Is_pinned DESC, a.Time_stamp DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
