require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth');
const challengeRoutes = require('./routes/challenges');
const participationRoutes = require('./routes/participations');
const submissionRoutes = require('./routes/submissions');
const reviewRoutes = require('./routes/reviews');

app.use('/api/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/submissions', submissionRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log('Server running on port ' + port);
});