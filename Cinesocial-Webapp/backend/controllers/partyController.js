const { poolPromise, sql } = require('../config/db');

// UC-21: Create Watch Party (sp_CreateParty)
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
        WHERE u.User_ID = @userId AND u.sub_exp > GETDATE()
      `);
      
    if (subCheck.recordset.length === 0 || !subCheck.recordset[0].Can_Join_Parties) {
      return res.status(403).json({ message: 'Premium feature: You cannot create or join parties.' });
    }

    // Call sp_CreateParty stored procedure
    const result = await pool.request()
      .input('name', sql.VarChar, partyName)
      .input('createdBy', sql.Int, userId)
      .input('movieId', sql.Int, movieId)
      .input('max', sql.Int, maxMembers)
      .input('inviteCode', sql.VarChar, inviteCode)
      .output('newPartyId', sql.Int)
      .execute('sp_CreateParty');

    const partyId = result.output.newPartyId;
    res.status(201).json({ message: 'Party created successfully', partyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-21 (F18): Get all active parties via vw_ActiveParties
exports.getActiveParties = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM vw_ActiveParties');
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-22: Join Watch Party
exports.joinParty = async (req, res) => {
  const { partyId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    // UC-22: Validate invite code and check capacity
    const partyResult = await pool.request()
      .input('partyId', sql.Int, partyId)
      .query(`
        SELECT Party_ID, Is_Active, Max_Members,
               (SELECT COUNT(*) FROM P_Members WHERE Party_ID = @partyId) AS current_count
        FROM Parties p
        WHERE p.Party_ID = @partyId
      `);

    if (partyResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Party not found' });
    }

    const party = partyResult.recordset[0];
    if (!party.Is_Active) {
      return res.status(400).json({ message: 'Party is no longer active' });
    }
    if (party.current_count >= party.Max_Members) {
      return res.status(400).json({ message: 'Party is already full' });
    }

    // UC-22: Add user as member
    await pool.request()
      .input('partyId', sql.Int, partyId)
      .input('userId', sql.Int, userId)
      .query("INSERT INTO P_Members (Party_ID, User_ID, Role) VALUES (@partyId, @userId, 'member')");

    // Auto-close if full
    if (party.current_count + 1 >= party.Max_Members) {
      await pool.request()
        .input('partyId', sql.Int, partyId)
        .query('UPDATE Parties SET Is_Active = 0 WHERE Party_ID = @partyId');
    }

    res.json({ message: 'Joined party successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-22 (F19): Get all members of a specific party
exports.getPartyMembers = async (req, res) => {
  const { partyId } = req.params;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('partyId', sql.Int, partyId)
      .query(`
        SELECT pm.Party_ID, pm.User_ID, u.Username, pm.Role, pm.Joined_Date
        FROM P_Members pm
        JOIN Users u ON pm.User_ID = u.User_ID
        WHERE pm.Party_ID = @partyId
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-23: Close Watch Party (host only)
exports.closeParty = async (req, res) => {
  const { partyId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    // Verify host role
    const hostCheck = await pool.request()
      .input('partyId', sql.Int, partyId)
      .input('userId', sql.Int, userId)
      .query("SELECT * FROM P_Members WHERE Party_ID = @partyId AND User_ID = @userId AND Role = 'host'");

    if (hostCheck.recordset.length === 0) {
      return res.status(403).json({ message: 'Only the host can close the party.' });
    }

    await pool.request()
      .input('partyId', sql.Int, partyId)
      .query('UPDATE Parties SET Is_Active = 0 WHERE Party_ID = @partyId');

    res.json({ message: 'Party closed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
