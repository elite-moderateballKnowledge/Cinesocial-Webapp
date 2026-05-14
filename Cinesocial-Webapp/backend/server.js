

require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();
const partyController = require('./controllers/partyController');

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost port
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CineSocial API is running' });
});

// Import routes
app.get('/api/home', require('./controllers/homeController').getHomepage);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/persons', require('./routes/persons'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/parties', require('./routes/parties'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

setInterval(() => {
  partyController.cancelUnderfilledDueParties().catch((err) => {
    console.error('[PARTY CHECK] Failed to cancel underfilled parties:', err);
  });
}, 60 * 1000);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n[ERROR] PORT ${PORT} IS ALREADY IN USE!`);
    console.error(`Please close any existing backend terminals or kill the process using port ${PORT}.\n`);
    process.exit(1);
  } else {
    console.error('[ERROR] Server failed to start:', err);
    process.exit(1);
  }
});
