const { poolPromise, sql } = require('../config/db');

// UC-15: Submit Review (sp_SubmitReview)
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
      .input('reviewText', sql.VarChar(sql.MAX), reviewText)
      .input('ip', sql.VarChar, req.ip)
      .input('spoiler', sql.Bit, containsSpoiler ? 1 : 0)
      .execute('sp_SubmitReview');

    res.status(201).json({ message: 'Review added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-16: Edit own review
exports.editReview = async (req, res) => {
  const { activityId } = req.params;
  const { reviewText } = req.body;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('reviewText', sql.VarChar(sql.MAX), reviewText)
      .input('userId', sql.Int, userId)
      .input('activityId', sql.Int, activityId)
      .query(`
        UPDATE Activity
        SET Review_text = @reviewText
        WHERE Activity_ID = @activityId AND User_ID = @userId
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Review not found or not owned by you' });
    }

    res.json({ message: 'Review updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-16: Delete own review
exports.deleteReview = async (req, res) => {
  const { activityId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('activityId', sql.Int, activityId)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM Activity WHERE Activity_ID = @activityId AND User_ID = @userId');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Review not found or not owned by you' });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-17: Pin Review to Top (Premium only)
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
        WHERE u.User_ID = @userId AND u.sub_exp > GETDATE()
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

// UC-13: Get Reviews for a movie via vw_CommunityVerdicts
exports.getMovieReviews = async (req, res) => {
  const { movieId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('movieId', sql.Int, movieId)
      .query(`
        SELECT * FROM vw_CommunityVerdicts
        WHERE movie_id = @movieId
        ORDER BY is_pinned DESC, timestamp DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-15 (Q8): Count of reviews per movie
exports.getReviewCountPerMovie = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Movie_ID, COUNT(*) AS No_of_reviews
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
