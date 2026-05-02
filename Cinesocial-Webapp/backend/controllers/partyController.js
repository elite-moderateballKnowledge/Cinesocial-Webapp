const { poolPromise, sql } = require('../config/db');

exports.createParty = async (req, res) => {
  const { partyName, movieId, maxMembers, inviteCode } = req.body;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    
    // Check gate
    const subCheck = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT s.Can_Join_Parties 
        FROM Users u
        LEFT JOIN Subscriptions s ON u.sub_ID = s.Subscription_ID
        WHERE u.User_ID = @userId
      `);
      
    if (subCheck.recordset.length === 0 || !subCheck.recordset[0].Can_Join_Parties) {
      return res.status(403).json({ message: 'Premium feature: You cannot create or join parties.' });
    }

    const result = await pool.request()
      .input('name', sql.VarChar, partyName)
      .input('createdBy', sql.Int, userId)
      .input('movieId', sql.Int, movieId)
      .input('max', sql.Int, maxMembers)
      .input('inviteCode', sql.VarChar, inviteCode)
      .query(`
        INSERT INTO Parties (Party_Name, Created_By, Movie_ID, Max_Members, Invite_Code, Is_Active)
        OUTPUT INSERTED.Party_ID
        VALUES (@name, @createdBy, @movieId, @max, @inviteCode, 1)
      `);
      
    const partyId = result.recordset[0].Party_ID;
    
    // Add creator as host
    await pool.request()
      .input('partyId', sql.Int, partyId)
      .input('userId', sql.Int, userId)
      .query(`INSERT INTO P_Members (Party_ID, User_ID, Role) VALUES (@partyId, @userId, 'host')`);

    res.status(201).json({ message: 'Party created successfully', partyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveParties = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`
        SELECT p.Party_ID, p.Party_Name, u.Username AS host, m.Title AS movie, p.Max_Members, p.Is_Active
        FROM Parties p
        JOIN Users u ON p.Created_By = u.User_ID
        JOIN Movies m ON p.Movie_ID = m.Movie_ID
        WHERE p.Is_Active = 1
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
