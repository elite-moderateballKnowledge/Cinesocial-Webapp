const { poolPromise, sql } = require('../config/db');

exports.getPlans = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Subscriptions');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.subscribe = async (req, res) => {
  const { planId } = req.body;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    
    // Get plan details
    const planResult = await pool.request()
      .input('planId', sql.Int, planId)
      .query('SELECT Duration_Days FROM Subscriptions WHERE Subscription_ID = @planId');
      
    if (planResult.recordset.length === 0) return res.status(404).json({ message: 'Plan not found' });
    const duration = planResult.recordset[0].Duration_Days;

    await pool.request()
      .input('userId', sql.Int, userId)
      .input('planId', sql.Int, planId)
      .input('duration', sql.Int, duration)
      .query(`
        UPDATE Users 
        SET sub_ID = @planId, sub_exp = DATEADD(day, @duration, GETDATE())
        WHERE User_ID = @userId
      `);

    res.json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
