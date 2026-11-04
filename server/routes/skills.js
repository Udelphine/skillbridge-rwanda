const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM skills ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, authorize('admin'), async (req, res) => {
  const { name, category } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Skill name is required' });
  }

  try {
    const existing = await pool.query('SELECT id FROM skills WHERE LOWER(name) = LOWER($1)', [name]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'This skill already exists' });
    }

    const result = await pool.query(
      'INSERT INTO skills (name, category) VALUES ($1, $2) RETURNING *',
      [name, category || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;