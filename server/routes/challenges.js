const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const { category, difficulty, status } = req.query;

  let query = 'SELECT * FROM challenges WHERE 1=1';
  const values = [];

  if (req.user.role !== 'admin') {
    query += " AND status = 'published'";
  } else if (status) {
    values.push(status);
    query += ' AND status = $' + values.length;
  }

  if (category) {
    values.push(category);
    query += ' AND category = $' + values.length;
  }

  if (difficulty) {
    values.push(difficulty);
    query += ' AND difficulty = $' + values.length;
  }

  query += ' ORDER BY created_at DESC';

  try {
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM challenges WHERE id = $1', [req.params.id]);
    const challenge = result.rows[0];

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (req.user.role !== 'admin' && challenge.status !== 'published') {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { title, description, category, difficulty, deadline } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO challenges (title, description, category, difficulty, deadline, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, category || null, difficulty || 'beginner', deadline || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { title, description, category, difficulty, deadline } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE challenges SET title = $1, description = $2, category = $3, difficulty = $4, deadline = $5 WHERE id = $6 RETURNING *',
      [title, description, category || null, difficulty || 'beginner', deadline || null, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  const { status } = req.body;

  if (!['draft', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Status must be draft, published or archived' });
  }

  try {
    const result = await pool.query(
      'UPDATE challenges SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;