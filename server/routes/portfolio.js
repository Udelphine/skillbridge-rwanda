const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const labelSql = "CASE WHEN submissions.status = 'reviewed' THEN 'Reviewed by mentor' ELSE 'Self-submitted' END AS review_label";

router.post('/', authenticate, authorize('student'), async (req, res) => {
  const { submission_id, title, description } = req.body;

  if (!submission_id || !title) {
    return res.status(400).json({ message: 'submission_id and title are required' });
  }

  try {
    const owned = await pool.query(
      'SELECT submissions.status FROM submissions JOIN participations ON submissions.participation_id = participations.id WHERE submissions.id = $1 AND participations.student_id = $2',
      [submission_id, req.user.id]
    );

    if (owned.rows.length === 0) {
      return res.status(403).json({ message: 'This is not your submission' });
    }

    if (owned.rows[0].status === 'draft') {
      return res.status(400).json({ message: 'Submit your project before adding it to your portfolio' });
    }

    const existing = await pool.query(
      'SELECT id FROM portfolio_items WHERE submission_id = $1 AND student_id = $2',
      [submission_id, req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'This project is already in your portfolio' });
    }

    const result = await pool.query(
      'INSERT INTO portfolio_items (student_id, submission_id, title, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, submission_id, title, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT portfolio_items.id, portfolio_items.title, portfolio_items.description, portfolio_items.visibility, submissions.repository_url, submissions.demo_url, ' + labelSql + ' FROM portfolio_items JOIN submissions ON portfolio_items.submission_id = submissions.id WHERE portfolio_items.student_id = $1 ORDER BY portfolio_items.created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/public/:studentId', async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT users.name AS student_name, portfolio_items.title, portfolio_items.description, submissions.repository_url, submissions.demo_url, " + labelSql + " FROM portfolio_items JOIN submissions ON portfolio_items.submission_id = submissions.id JOIN users ON portfolio_items.student_id = users.id WHERE portfolio_items.student_id = $1 AND portfolio_items.visibility = 'public' AND users.status = 'active' ORDER BY portfolio_items.created_at DESC",
      [req.params.studentId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/visibility', authenticate, authorize('student'), async (req, res) => {
  const { visibility } = req.body;

  if (!['private', 'public'].includes(visibility)) {
    return res.status(400).json({ message: 'Visibility must be private or public' });
  }

  try {
    const result = await pool.query(
      'UPDATE portfolio_items SET visibility = $1 WHERE id = $2 AND student_id = $3 RETURNING *',
      [visibility, req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM portfolio_items WHERE id = $1 AND student_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Portfolio item not found' });
    }

    res.json({ message: 'Portfolio item removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;