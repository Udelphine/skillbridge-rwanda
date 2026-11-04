const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/stats', async (req, res) => {
  try {
    const users = await pool.query('SELECT role, COUNT(*)::int AS total FROM users GROUP BY role');
    const challenges = await pool.query('SELECT status, COUNT(*)::int AS total FROM challenges GROUP BY status');
    const participations = await pool.query('SELECT COUNT(*)::int AS total FROM participations');
    const submissions = await pool.query('SELECT status, COUNT(*)::int AS total FROM submissions GROUP BY status');

    res.json({
      users: users.rows,
      challenges: challenges.rows,
      participations: participations.rows[0].total,
      submissions: submissions.rows
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, status, created_at FROM users ORDER BY id'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) {
    return res.status(400).json({ message: 'Status must be active or inactive' });
  }

  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'You cannot change your own status' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;