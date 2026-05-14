const { poolPromise, sql } = require('../config/db');

const MIN_PARTY_MEMBERS = 4;

const normalizeInviteCode = (inviteCode) => String(inviteCode || '').trim().toUpperCase();

const ensurePartySchema = async (pool) => {
  await pool.request().query(`
    IF COL_LENGTH('Parties', 'Location_Description') IS NULL
      ALTER TABLE Parties ADD Location_Description VARCHAR(255) NULL;

    IF COL_LENGTH('Parties', 'Scheduled_At') IS NULL
      ALTER TABLE Parties ADD Scheduled_At DATETIME NULL;

    IF COL_LENGTH('Parties', 'Cancelled_At') IS NULL
      ALTER TABLE Parties ADD Cancelled_At DATETIME NULL;

    IF COL_LENGTH('Parties', 'Cancelled_Reason') IS NULL
      ALTER TABLE Parties ADD Cancelled_Reason VARCHAR(255) NULL;

    UPDATE Parties
    SET Location_Description = 'Location TBD'
    WHERE Location_Description IS NULL;

    UPDATE Parties
    SET Scheduled_At = DATEADD(DAY, 7, GETDATE())
    WHERE Scheduled_At IS NULL
      AND Is_Active = 1;
  `);
};

const notifyPartyCancellation = async (pool, party) => {
  const members = await pool.request()
    .input('partyId', sql.Int, party.Party_ID)
    .input('createdBy', sql.Int, party.Created_By)
    .query(`
      SELECT DISTINCT User_ID
      FROM (
        SELECT User_ID FROM P_Members WHERE Party_ID = @partyId
        UNION
        SELECT @createdBy AS User_ID
      ) notified_users
      WHERE User_ID IS NOT NULL
    `);

  const details = `Your party "${party.Party_Name}" for ${party.Movie_Title || 'the selected movie'} was cancelled because fewer than ${MIN_PARTY_MEMBERS} members joined before the scheduled time.`;

  for (const member of members.recordset) {
    await pool.request()
      .input('userId', sql.Int, member.User_ID)
      .input('partyId', sql.Int, party.Party_ID)
      .input('details', sql.VarChar, details)
      .query(`
        INSERT INTO Activity (User_ID, Action_Type, Entity_type, Entity_ID, Details)
        VALUES (@userId, 'PARTY_CANCELLED', 'Party', @partyId, @details)
      `);
  }
};

const cancelUnderfilledDueParties = async (pool) => {
  await ensurePartySchema(pool);

  const dueParties = await pool.request()
    .input('minimumMembers', sql.Int, MIN_PARTY_MEMBERS)
    .query(`
      SELECT
        p.Party_ID,
        p.Party_Name,
        p.Created_By,
        p.Scheduled_At,
        m.Title AS Movie_Title,
        COUNT(pm.User_ID) AS current_member_count
      FROM Parties p
      LEFT JOIN P_Members pm ON p.Party_ID = pm.Party_ID
      LEFT JOIN Movies m ON p.Movie_ID = m.Movie_ID
      WHERE p.Is_Active = 1
        AND p.Scheduled_At IS NOT NULL
        AND p.Scheduled_At <= GETDATE()
      GROUP BY p.Party_ID, p.Party_Name, p.Created_By, p.Scheduled_At, m.Title
      HAVING COUNT(pm.User_ID) < @minimumMembers
    `);

  for (const party of dueParties.recordset) {
    const updateResult = await pool.request()
      .input('partyId', sql.Int, party.Party_ID)
      .input('reason', sql.VarChar, `Automatically cancelled because fewer than ${MIN_PARTY_MEMBERS} members joined before party time.`)
      .query(`
        UPDATE Parties
        SET Is_Active = 0,
            Cancelled_At = GETDATE(),
            Cancelled_Reason = @reason
        WHERE Party_ID = @partyId
          AND Is_Active = 1
      `);

    if (updateResult.rowsAffected[0] > 0) {
      await notifyPartyCancellation(pool, party);
    }
  }

  return dueParties.recordset.length;
};

exports.cancelUnderfilledDueParties = async () => {
  const pool = await poolPromise;
  return cancelUnderfilledDueParties(pool);
};

// UC-21: Create Watch Party
exports.createParty = async (req, res) => {
  const { partyName, movieId, maxMembers, inviteCode, location, scheduledAt } = req.body;
  const userId = req.user.userId;
  const parsedMovieId = Number(movieId);
  const parsedMaxMembers = Number(maxMembers);
  const trimmedPartyName = String(partyName || '').trim();
  const trimmedLocation = String(location || '').trim();
  const normalizedInviteCode = normalizeInviteCode(inviteCode);
  const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;

  if (!trimmedPartyName || !parsedMovieId || !normalizedInviteCode || !trimmedLocation || !scheduledDate) {
    return res.status(400).json({ message: 'Party name, movie, invite code, location, and party time are required.' });
  }

  if (!Number.isInteger(parsedMaxMembers) || parsedMaxMembers < MIN_PARTY_MEMBERS) {
    return res.status(400).json({ message: `Max members must be at least ${MIN_PARTY_MEMBERS}.` });
  }

  if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
    return res.status(400).json({ message: 'Party time must be a valid future date and time.' });
  }

  try {
    const pool = await poolPromise;
    await ensurePartySchema(pool);
    await cancelUnderfilledDueParties(pool);
    
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

    const movieCheck = await pool.request()
      .input('movieId', sql.Int, parsedMovieId)
      .query('SELECT Movie_ID FROM Movies WHERE Movie_ID = @movieId');

    if (movieCheck.recordset.length === 0) {
      return res.status(404).json({ message: 'Movie not found.' });
    }

    const duplicateInvite = await pool.request()
      .input('inviteCode', sql.VarChar, normalizedInviteCode)
      .query('SELECT Party_ID FROM Parties WHERE Invite_Code = @inviteCode');

    if (duplicateInvite.recordset.length > 0) {
      return res.status(400).json({ message: 'Invite code is already in use. Please choose another one.' });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const insertResult = await new sql.Request(transaction)
        .input('name', sql.VarChar, trimmedPartyName)
        .input('createdBy', sql.Int, userId)
        .input('movieId', sql.Int, parsedMovieId)
        .input('max', sql.Int, parsedMaxMembers)
        .input('inviteCode', sql.VarChar, normalizedInviteCode)
        .input('location', sql.VarChar, trimmedLocation)
        .input('scheduledAt', sql.DateTime, scheduledDate)
        .query(`
          INSERT INTO Parties (Party_Name, Created_By, Movie_ID, Max_Members, Invite_Code, Location_Description, Scheduled_At, Is_Active)
          OUTPUT INSERTED.Party_ID
          VALUES (@name, @createdBy, @movieId, @max, @inviteCode, @location, @scheduledAt, 1)
        `);

      const partyId = insertResult.recordset[0].Party_ID;

      await new sql.Request(transaction)
        .input('partyId', sql.Int, partyId)
        .input('userId', sql.Int, userId)
        .query("INSERT INTO P_Members (Party_ID, User_ID, Role) VALUES (@partyId, @userId, 'host')");

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

// UC-21 (F18): Get all active parties
exports.getActiveParties = async (req, res) => {
  try {
    const pool = await poolPromise;
    await ensurePartySchema(pool);
    await cancelUnderfilledDueParties(pool);

    const result = await pool.request()
      .query(`
        SELECT
          p.Party_ID,
          p.Party_Name,
          u.Username AS host,
          m.Title AS movie,
          p.Movie_ID,
          p.Max_Members,
          p.Location_Description,
          p.Scheduled_At,
          p.Is_Active,
          COUNT(pm.User_ID) AS current_member_count
        FROM Parties p
        JOIN Users u ON p.Created_By = u.User_ID
        JOIN Movies m ON p.Movie_ID = m.Movie_ID
        LEFT JOIN P_Members pm ON p.Party_ID = pm.Party_ID
        WHERE p.Is_Active = 1
          AND (p.Scheduled_At IS NULL OR p.Scheduled_At > GETDATE())
        GROUP BY p.Party_ID, p.Party_Name, u.Username, m.Title, p.Movie_ID, p.Max_Members, p.Location_Description, p.Scheduled_At, p.Is_Active, p.Created_at
        ORDER BY p.Scheduled_At ASC, p.Created_at DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// UC-22: Join Watch Party
exports.joinParty = async (req, res) => {
  const { partyId } = req.params;
  const { inviteCode } = req.body || {};
  const userId = req.user.userId;
  const normalizedInviteCode = normalizeInviteCode(inviteCode);

  if (!normalizedInviteCode) {
    return res.status(400).json({ message: 'Invite code is required to join this party.' });
  }

  try {
    const pool = await poolPromise;
    await ensurePartySchema(pool);
    await cancelUnderfilledDueParties(pool);

    // UC-22: Validate invite code and check capacity
    const partyResult = await pool.request()
      .input('partyId', sql.Int, partyId)
      .query(`
        SELECT Party_ID, Is_Active, Max_Members, Invite_Code, Scheduled_At,
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
    if (party.Scheduled_At && new Date(party.Scheduled_At) <= new Date()) {
      return res.status(400).json({ message: 'Party time has already passed.' });
    }
    if (normalizeInviteCode(party.Invite_Code) !== normalizedInviteCode) {
      return res.status(403).json({ message: 'Invalid invite code.' });
    }
    if (party.current_count >= party.Max_Members) {
      return res.status(400).json({ message: 'Party is already full' });
    }

    const memberCheck = await pool.request()
      .input('partyId', sql.Int, partyId)
      .input('userId', sql.Int, userId)
      .query('SELECT 1 FROM P_Members WHERE Party_ID = @partyId AND User_ID = @userId');

    if (memberCheck.recordset.length > 0) {
      return res.status(400).json({ message: 'You are already in this party.' });
    }

    // UC-22: Add user as member
    await pool.request()
      .input('partyId', sql.Int, partyId)
      .input('userId', sql.Int, userId)
      .query("INSERT INTO P_Members (Party_ID, User_ID, Role) VALUES (@partyId, @userId, 'member')");

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
    await ensurePartySchema(pool);

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

exports.getPartyNotifications = async (req, res) => {
  const userId = req.user.userId;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT TOP 10 Activity_ID, Entity_ID AS Party_ID, Details, Time_stamp
        FROM Activity
        WHERE User_ID = @userId
          AND Action_Type = 'PARTY_CANCELLED'
        ORDER BY Time_stamp DESC
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
