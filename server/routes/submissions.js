const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function validUrl(url) {
  return /^https?:\/\/\S+\.\S+/.test(url);
}

function checkInput(summary, repositoryUrl, demoUrl) {
  if (!summary) return 'Summary is required';
  if (!repositoryUrl && !demoUrl) return 'Add a repository URL or a demo URL';
  if (repositoryUrl && !validUrl(repositoryUrl)) return 'Repository URL is not valid';
  if (demoUrl && !validUrl(demoUrl)) return 'Demo URL is not valid';
  return null;
}

router.post('/', authenticate, authorize('student'), async (req, res) => {
  const { participation_id, summary, repository_url, demo_url } = req.body;

  if (!participation_id) {
    return res.status(400).json({ message: 'participation_id is required' });
  }

  const problem = checkInput(summary, repository_url, demo_url);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  try {
    const owned = await pool.query(
      'SELECT id FROM participations WHERE id = $1 AND student_id = $2',
      [participation_id, req.user.id]
    );

    if (owned.rows.length === 0) {
      return res.status(403).json({ message: 'This is not your participation' });
    }

    const result = await pool.query(
      'INSERT INTO submissions (participation_id, summary, repository_url, demo_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [participation_id, summary, repository_url || null, demo_url || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT submissions.*, challenges.title FROM submissions JOIN participations ON submissions.participation_id = participations.id JOIN challenges ON participations.challenge_id = challenges.id WHERE participations.student_id = $1 ORDER BY submissions.id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/assigned', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT submissions.*, challenges.title, users.name AS student_name FROM submissions JOIN participations ON submissions.participation_id = participations.id JOIN challenges ON participations.challenge_id = challenges.id JOIN users ON participations.student_id = users.id WHERE submissions.mentor_id = $1 ORDER BY submissions.id DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT submissions.*, challenges.title, users.name AS student_name FROM submissions JOIN participations ON submissions.participation_id = participations.id JOIN challenges ON participations.challenge_id = challenges.id JOIN users ON participations.student_id = users.id ORDER BY submissions.id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT submissions.*, participations.student_id FROM submissions JOIN participations ON submissions.participation_id = participations.id WHERE submissions.id = $1',
      [req.params.id]
    );
    const submission = result.rows[0];

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = submission.student_id === req.user.id;
    const isMentor = submission.mentor_id === req.user.id;

    if (!isAdmin && !isOwner && !isMentor) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', authenticate, authorize('student'), async (req, res) => {
  const { summary, repository_url, demo_url } = req.body;

  const problem = checkInput(summary, repository_url, demo_url);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  try {
    const found = await pool.query(
      'SELECT submissions.status FROM submissions JOIN participations ON submissions.participation_id = participations.id WHERE submissions.id = $1 AND participations.student_id = $2',
      [req.params.id, req.user.id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (!['draft', 'revision_requested'].includes(found.rows[0].status)) {
      return res.status(400).json({ message: 'This submission cannot be edited now' });
    }

    const result = await pool.query(
      'UPDATE submissions SET summary = $1, repository_url = $2, demo_url = $3 WHERE id = $4 RETURNING *',
      [summary, repository_url || null, demo_url || null, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const found = await pool.query(
      'SELECT submissions.status FROM submissions JOIN participations ON submissions.participation_id = participations.id WHERE submissions.id = $1 AND participations.student_id = $2',
      [req.params.id, req.user.id]
    );

    if (found.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (!['draft', 'revision_requested'].includes(found.rows[0].status)) {
      return res.status(400).json({ message: 'This submission cannot be submitted now' });
    }

    const result = await pool.query(
      "UPDATE submissions SET status = 'submitted', submitted_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/mentor', authenticate, authorize('admin'), async (req, res) => {
  const { mentor_id } = req.body;

  if (!mentor_id) {
    return res.status(400).json({ message: 'mentor_id is required' });
  }

  try {
    const mentor = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'mentor' AND status = 'active'",
      [mentor_id]
    );

    if (mentor.rows.length === 0) {
      return res.status(400).json({ message: 'This user is not an active mentor' });
    }

    const result = await pool.query(
      'UPDATE submissions SET mentor_id = $1 WHERE id = $2 RETURNING *',
      [mentor_id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;