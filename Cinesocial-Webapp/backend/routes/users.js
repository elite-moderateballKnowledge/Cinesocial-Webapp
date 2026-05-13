const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/auth');
const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next();
  const token = authHeader.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // we'll skip DB check for optional
  } catch (ex) {}
  next();
};

router.get('/me', verifyToken, userController.getProfile);
router.get('/', userController.getRecentMembers);
router.get('/:id', optionalAuth, userController.getProfile);
router.put('/me', verifyToken, userController.updateProfile);
router.put('/me/genres', verifyToken, userController.updateGenrePreferences);
router.get('/:id/favourites',        userController.getFavouriteMovies);
router.put('/me/favourites',  verifyToken, userController.setFavouriteMovies);
router.get('/:id/mutuals',   verifyToken, userController.getMutualFriends);

module.exports = router;
