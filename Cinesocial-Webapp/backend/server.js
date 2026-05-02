require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CineSocial API is running' });
});

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/users', require('./routes/users'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/parties', require('./routes/parties'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/admin', require('./routes/admin'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
