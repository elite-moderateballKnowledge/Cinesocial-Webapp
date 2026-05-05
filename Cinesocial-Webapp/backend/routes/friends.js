const express = require('express');
const router  = express.Router();
const fc          = require('../controllers/friendController');
const verifyToken = require('../middleware/auth');

// All friends routes require authentication
router.use(verifyToken);

// GET  /api/friends                          — my confirmed friends
router.get('/',                     fc.getFriends);

// GET  /api/friends/search?q=username        — user search with status
router.get('/search',               fc.searchUsers);

// GET  /api/friends/requests                 — incoming pending requests
router.get('/requests',             fc.getIncomingRequests);

// GET  /api/friends/requests/sent            — requests I sent
router.get('/requests/sent',        fc.getSentRequests);

// POST /api/friends/request/:userId          — send a request
router.post('/request/:userId',     fc.sendRequest);

// POST /api/friends/request/:requestId/accept
router.post('/request/:requestId/accept',  fc.acceptRequest);

// POST /api/friends/request/:requestId/decline
router.post('/request/:requestId/decline', fc.declineRequest);

// DELETE /api/friends/:friendId              — unfriend
router.delete('/:friendId',         fc.removeFriend);

module.exports = router;
