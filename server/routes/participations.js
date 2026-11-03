const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, authorize('student'), async (req, res) => {
  const { challenge_id } = req.body;

  if (!challenge_id) {
    return res.status(400).json({ message: 'challenge_id is required' });
  }

  try {
    const challenge = await pool.query(
      "SELECT id FROM challenges WHERE id = $1 AND status = 'published' AND (deadline IS NULL OR deadline >= CURRENT_DATE)",
      [challenge_id]
    );

    if (challenge.rows.length === 0) {
      return res.status(400).json({ message: 'This challenge is not open for joining' });
    }

    const existing = await pool.query(
      'SELECT id FROM participations WHERE challenge_id = $1 AND student_id = $2',
      [challenge_id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'You have already joined this challenge' });
    }

    const result = await pool.query(
      'INSERT INTO participations (challenge_id, student_id) VALUES ($1, $2) RETURNING *',
      [challenge_id, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT participations.id, participations.status, participations.joined_at, challenges.id AS challenge_id, challenges.title, challenges.deadline FROM participations JOIN challenges ON participations.challenge_id = challenges.id WHERE participations.student_id = $1 ORDER BY participations.joined_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;