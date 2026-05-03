const { poolPromise, sql } = require('../config/db');

exports.getProfile = async (req, res) => {
  const userId = req.params.id || req.user.userId;
  
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT user_id AS User_ID, username AS Username, Email, Join_date, Bio, sub_ID, sub_expiry AS sub_exp, flair_label, Profile_Pic_URL,
               plan_name AS Plan_Name, Has_Profile_Flair
        FROM vw_UserProfile
        WHERE user_id = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.recordset[0];
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
          WHERE u.User_ID = @userId
        `);
      
      if (subCheck.recordset.length === 0 || !subCheck.recordset[0].Has_Profile_Flair) {
        return res.status(403).json({ message: 'Premium feature: You cannot set a profile flair.' });
      }
    }

    await pool.request()
      .input('bio', sql.Text, bio || null)
      .input('flairLabel', sql.VarChar, flairLabel || null)
      .input('pic', sql.VarChar, profilePicUrl || null)
      .input('userId', sql.Int, userId)
      .query(`
        UPDATE Users 
        SET Bio = ISNULL(@bio, Bio),
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
