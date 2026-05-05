const { poolPromise, sql } = require('../config/db');

// helper: relative time string
function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs/60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs/3600)}h ago`;
  return `${Math.floor(secs/86400)}d ago`;
}

// ─── GET /api/friends ────────────────────────────────────────
// Returns authenticated user's confirmed friends from vw_FriendList
exports.getFriends = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT Friend_ID, Friend_Username AS Username,
               flair_label, Profile_Pic_URL, has_premium_flair
        FROM vw_FriendList
        WHERE User_ID = @userId
        ORDER BY Friend_Username
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getFriends:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/friends/requests ───────────────────────────────
// Pending requests where Receiver_ID = current user
exports.getIncomingRequests = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT fr.Request_ID, fr.Sender_ID, fr.Created_At,
               u.Username AS sender_username,
               u.Profile_Pic_URL AS sender_pic,
               u.flair_label AS sender_flair
        FROM FriendRequests fr
        JOIN Users u ON fr.Sender_ID = u.User_ID
        WHERE fr.Receiver_ID = @userId AND fr.Status = 'pending'
        ORDER BY fr.Created_At DESC
      `);
    const rows = result.recordset.map(r => ({
      ...r,
      time_ago: timeAgo(r.Created_At),
    }));
    res.json(rows);
  } catch (err) {
    console.error('getIncomingRequests:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/friends/requests/sent ──────────────────────────
// All requests sent by the current user with their current status
exports.getSentRequests = async (req, res) => {
  const userId = req.user.userId;
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT fr.Request_ID, fr.Receiver_ID, fr.Status, fr.Created_At,
               u.Username AS receiver_username,
               u.Profile_Pic_URL AS receiver_pic,
               u.flair_label AS receiver_flair
        FROM FriendRequests fr
        JOIN Users u ON fr.Receiver_ID = u.User_ID
        WHERE fr.Sender_ID = @userId
        ORDER BY fr.Created_At DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('getSentRequests:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/friends/request/:userId ───────────────────────
// Send a friend request
exports.sendRequest = async (req, res) => {
  const senderId   = req.user.userId;
  const receiverId = parseInt(req.params.userId, 10);

  if (senderId === receiverId)
    return res.status(400).json({ message: 'Cannot add yourself.' });

  try {
    const pool = await poolPromise;

    // 1. Target user exists and is_valid
    const targetCheck = await pool.request()
      .input('receiverId', sql.Int, receiverId)
      .query(`SELECT User_ID FROM Users WHERE User_ID = @receiverId AND is_valid = 1`);
    if (targetCheck.recordset.length === 0)
      return res.status(404).json({ message: 'User not found.' });

    // 2. Not already friends
    const friendCheck = await pool.request()
      .input('senderId',   sql.Int, senderId)
      .input('receiverId', sql.Int, receiverId)
      .query(`SELECT 1 FROM Friends WHERE U_ID = @senderId AND F_ID = @receiverId`);
    if (friendCheck.recordset.length > 0)
      return res.status(409).json({ message: 'Already friends.' });

    // 3. No existing pending request in either direction
    const reqCheck = await pool.request()
      .input('a', sql.Int, senderId)
      .input('b', sql.Int, receiverId)
      .query(`
        SELECT 1 FROM FriendRequests
        WHERE Status = 'pending'
          AND ((Sender_ID = @a AND Receiver_ID = @b)
            OR (Sender_ID = @b AND Receiver_ID = @a))
      `);
    if (reqCheck.recordset.length > 0)
      return res.status(409).json({ message: 'A pending request already exists between you two.' });

    await pool.request()
      .input('senderId',   sql.Int, senderId)
      .input('receiverId', sql.Int, receiverId)
      .query(`
        INSERT INTO FriendRequests (Sender_ID, Receiver_ID)
        VALUES (@senderId, @receiverId)
      `);

    res.status(201).json({ message: 'Friend request sent.' });
  } catch (err) {
    console.error('sendRequest:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/friends/request/:requestId/accept ─────────────
// Calls sp_AcceptFriendRequest — only receiver can accept
exports.acceptRequest = async (req, res) => {
  const receiverId = req.user.userId;
  const requestId  = parseInt(req.params.requestId, 10);

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('requestId',  sql.Int, requestId)
      .input('receiverId', sql.Int, receiverId)
      .execute('sp_AcceptFriendRequest');

    res.json({ message: 'Friend request accepted.' });
  } catch (err) {
    console.error('acceptRequest:', err);
    if (err.message?.includes('not found'))
      return res.status(404).json({ message: 'Request not found or already resolved.' });
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── POST /api/friends/request/:requestId/decline ────────────
// Sets Status = 'declined' — only receiver can decline
exports.declineRequest = async (req, res) => {
  const receiverId = req.user.userId;
  const requestId  = parseInt(req.params.requestId, 10);

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('requestId',  sql.Int, requestId)
      .input('receiverId', sql.Int, receiverId)
      .query(`
        UPDATE FriendRequests
        SET Status      = 'declined',
            Resolved_At = GETDATE()
        WHERE Request_ID  = @requestId
          AND Receiver_ID = @receiverId
          AND Status      = 'pending'
      `);

    if (result.rowsAffected[0] === 0)
      return res.status(404).json({ message: 'Request not found or already resolved.' });

    res.json({ message: 'Friend request declined.' });
  } catch (err) {
    console.error('declineRequest:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── DELETE /api/friends/:friendId ───────────────────────────
// Removes both directions from Friends — does not delete history
exports.removeFriend = async (req, res) => {
  const userId   = req.user.userId;
  const friendId = parseInt(req.params.friendId, 10);

  try {
    const pool = await poolPromise;
    await pool.request()
      .input('userId',   sql.Int, userId)
      .input('friendId', sql.Int, friendId)
      .query(`
        DELETE FROM Friends
        WHERE (U_ID = @userId   AND F_ID = @friendId)
           OR (U_ID = @friendId AND F_ID = @userId)
      `);

    res.json({ message: 'Friend removed.' });
  } catch (err) {
    console.error('removeFriend:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/friends/search?q=username ─────────────────────
// Search users by username; returns friendship_status
exports.searchUsers = async (req, res) => {
  const userId = req.user.userId;
  const q      = (req.query.q || '').trim();

  if (!q) return res.json([]);

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('query',  sql.VarChar, `%${q}%`)
      .query(`
        SELECT
          u.User_ID        AS user_id,
          u.Username       AS username,
          u.flair_label,
          u.Profile_Pic_URL AS profile_pic_url,
          u.has_premium_flair,
          -- friendship_status derivation
          CASE
            WHEN EXISTS (
              SELECT 1 FROM Friends
              WHERE U_ID = @userId AND F_ID = u.User_ID
            ) THEN 'friends'
            WHEN EXISTS (
              SELECT 1 FROM FriendRequests
              WHERE Sender_ID = @userId AND Receiver_ID = u.User_ID AND Status = 'pending'
            ) THEN 'pending_sent'
            WHEN EXISTS (
              SELECT 1 FROM FriendRequests
              WHERE Sender_ID = u.User_ID AND Receiver_ID = @userId AND Status = 'pending'
            ) THEN 'pending_received'
            ELSE 'none'
          END AS friendship_status,
          -- request_id so front-end can accept inline
          (SELECT TOP 1 Request_ID FROM FriendRequests
           WHERE Sender_ID = u.User_ID AND Receiver_ID = @userId AND Status = 'pending'
          ) AS incoming_request_id
        FROM Users u
        WHERE u.Username LIKE @query
          AND u.User_ID <> @userId
          AND u.is_valid = 1
        ORDER BY u.Username
      `);
    res.json(result.recordset);
  } catch (err) {
    console.error('searchUsers:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
