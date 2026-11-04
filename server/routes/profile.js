const express = require('express');
const pool = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, authorize('student'), async (req, res) => {
  try {
    const profile = await pool.query(
      'SELECT users.name, users.email, student_profiles.education, student_profiles.bio, student_profiles.interests, student_profiles.visibility FROM users JOIN student_profiles ON student_profiles.user_id = users.id WHERE users.id = $1',
      [req.user.id]
    );

    const skills = await pool.query(
      'SELECT skills.id, skills.name, student_skills.proficiency FROM student_skills JOIN skills ON student_skills.skill_id = skills.id WHERE student_skills.student_id = $1 ORDER BY skills.name',
      [req.user.id]
    );

    res.json({ ...profile.rows[0], skills: skills.rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/me', authenticate, authorize('student'), async (req, res) => {
  const { education, bio, interests, visibility } = req.body;

  if (visibility && !['private', 'public'].includes(visibility)) {
    return res.status(400).json({ message: 'Visibility must be private or public' });
  }

  try {
    const result = await pool.query(
      'UPDATE student_profiles SET education = $1, bio = $2, interests = $3, visibility = COALESCE($4, visibility) WHERE user_id = $5 RETURNING *',
      [education || null, bio || null, interests || null, visibility || null, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/skills', authenticate, authorize('student'), async (req, res) => {
  const { skill_id, proficiency } = req.body;
  const level = proficiency || 'beginner';

  if (!skill_id) {
    return res.status(400).json({ message: 'skill_id is required' });
  }

  if (!['beginner', 'intermediate', 'advanced'].includes(level)) {
    return res.status(400).json({ message: 'Proficiency must be beginner, intermediate or advanced' });
  }

  try {
    const skill = await pool.query('SELECT id FROM skills WHERE id = $1', [skill_id]);
    if (skill.rows.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const result = await pool.query(
      'INSERT INTO student_skills (student_id, skill_id, proficiency) VALUES ($1, $2, $3) ON CONFLICT (student_id, skill_id) DO UPDATE SET proficiency = $3 RETURNING *',
      [req.user.id, skill_id, level]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/skills/:skillId', authenticate, authorize('student'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM student_skills WHERE student_id = $1 AND skill_id = $2 RETURNING skill_id',
      [req.user.id, req.params.skillId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Skill not found on your profile' });
    }

    res.json({ message: 'Skill removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;