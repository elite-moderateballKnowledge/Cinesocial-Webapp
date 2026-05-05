const { poolPromise, sql } = require('../config/db');

// UC-06: View Subscription Plans
exports.getPlans = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT Subscription_ID, Plan_Name, Price_USD, Duration_Days,
             Can_Join_Parties, Can_Pin_Reviews, Has_Profile_Flair, Max_Party_Size
      FROM Subscriptions
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-07: Upgrade to Premium (sp_UpgradeToPremium)
exports.subscribe = async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    // Get plan details for duration
    const planResult = await pool.request()
      .input('planId', sql.Int, planId)
      .query('SELECT Duration_Days FROM Subscriptions WHERE Subscription_ID = @planId');

    if (planResult.recordset.length === 0) return res.status(404).json({ message: 'Plan not found' });
    const duration = planResult.recordset[0].Duration_Days;

    // Call sp_UpgradeToPremium stored procedure
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('planId', sql.Int, planId)
      .input('duration', sql.Int, duration)
      .execute('sp_UpgradeToPremium');

    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-07 (Q16): Get all currently active premium users
exports.getActivePremiumUsers = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT *
      FROM Users u
      JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
      WHERE u.sub_ID IS NOT NULL
        AND u.sub_exp > GETDATE()
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

