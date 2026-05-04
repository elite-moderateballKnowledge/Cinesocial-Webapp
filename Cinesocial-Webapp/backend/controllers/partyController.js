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

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const request1 = new sql.Request(transaction);
      const result = await request1
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

      const request2 = new sql.Request(transaction);
      await request2
        .input('partyId', sql.Int, partyId)
        .input('userId', sql.Int, userId)
        .query(`INSERT INTO P_Members (Party_ID, User_ID, Role) VALUES (@partyId, @userId, 'host')`);

      await transaction.commit();
      res.status(201).json({ message: 'Party created successfully', partyId });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
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
        SELECT party_id AS Party_ID, party_name AS Party_Name, host, movie, max_members AS Max_Members, is_active AS Is_Active
        FROM vw_ActiveParties
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.joinParty = async (req, res) => {
  const { partyId } = req.params;
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;

    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    try {
      const checkReq = new sql.Request(transaction);
      const partyResult = await checkReq
        .input('partyId', sql.Int, partyId)
        .query(`
          SELECT p.Max_Members, p.Is_Active, (SELECT COUNT(*) FROM P_Members WHERE Party_ID = @partyId) AS Current_Members
          FROM Parties p
          WHERE p.Party_ID = @partyId
        `);

      if (partyResult.recordset.length === 0) {
        throw new Error('Party not found');
      }

      const party = partyResult.recordset[0];
      if (!party.Is_Active) {
        throw new Error('Party is no longer active');
      }
      if (party.Current_Members >= party.Max_Members) {
        throw new Error('Party is already full');
      }

      const insertReq = new sql.Request(transaction);
      await insertReq
        .input('partyId', sql.Int, partyId)
        .input('userId', sql.Int, userId)
        .query(`INSERT INTO P_Members (Party_ID, User_ID, Role) VALUES (@partyId, @userId, 'member')`);

      if (party.Current_Members + 1 >= party.Max_Members) {
        const updateReq = new sql.Request(transaction);
        await updateReq
          .input('partyId', sql.Int, partyId)
          .query(`UPDATE Parties SET Is_Active = 0 WHERE Party_ID = @partyId`);
      }

      await transaction.commit();
      res.json({ message: 'Joined party successfully' });
    } catch (err) {
      await transaction.rollback();
      if (err.message === 'Party not found' || err.message === 'Party is no longer active' || err.message === 'Party is already full') {
        return res.status(400).json({ message: err.message });
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
