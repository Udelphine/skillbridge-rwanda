const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

function validScore(score) {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

router.patch('/start/:submissionId', authenticate, authorize('mentor'), async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE submissions SET status = 'in_review' WHERE id = $1 AND mentor_id = $2 AND status = 'submitted' RETURNING *",
      [req.params.submissionId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Submission is not assigned to you or is not ready for review' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, authorize('mentor'), async (req, res) => {
  const {
    submission_id,
    requirement_score,
    technical_score,
    problem_solving_score,
    documentation_score,
    communication_score,
    feedback,
    decision
  } = req.body;

  if (!submission_id || !feedback) {
    return res.status(400).json({ message: 'submission_id and feedback are required' });
  }

  if (!['revision_requested', 'reviewed'].includes(decision)) {
    return res.status(400).json({ message: 'Decision must be revision_requested or reviewed' });
  }

  const scores = [
    requirement_score,
    technical_score,
    problem_solving_score,
    documentation_score,
    communication_score
  ];

  if (!scores.every(validScore)) {
    return res.status(400).json({ message: 'Each score must be a whole number from 1 to 5' });
  }

  try {
    const found = await pool.query(
      'SELECT status FROM submissions WHERE id = $1 AND mentor_id = $2',
      [submission_id, req.user.id]
    );

    if (found.rows.length === 0) {
      return res.status(403).json({ message: 'This submission is not assigned to you' });
    }

    if (!['submitted', 'in_review'].includes(found.rows[0].status)) {
      return res.status(400).json({ message: 'This submission is not waiting for review' });
    }

    const result = await pool.query(
      'INSERT INTO reviews (submission_id, mentor_id, requirement_score, technical_score, problem_solving_score, documentation_score, communication_score, feedback, decision) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [submission_id, req.user.id, ...scores, feedback, decision]
    );

    await pool.query('UPDATE submissions SET status = $1 WHERE id = $2', [decision, submission_id]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/submission/:id', authenticate, async (req, res) => {
  try {
    const found = await pool.query(
      'SELECT submissions.mentor_id, participations.student_id FROM submissions JOIN participations ON submissions.participation_id = participations.id WHERE submissions.id = $1',
      [req.params.id]
    );
    const submission = found.rows[0];

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const isAdmin = req.user.role === 'admin';
    const isOwner = submission.student_id === req.user.id;
    const isMentor = submission.mentor_id === req.user.id;

    if (!isAdmin && !isOwner && !isMentor) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const result = await pool.query(
      'SELECT reviews.*, users.name AS mentor_name FROM reviews JOIN users ON reviews.mentor_id = users.id WHERE reviews.submission_id = $1 ORDER BY reviews.reviewed_at DESC',
      [req.params.id]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;