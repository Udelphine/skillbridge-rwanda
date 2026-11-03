require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./db');

const name = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
const role = process.argv[5];

async function createUser() {
  if (!name || !email || !password || !role) {
    console.log('Usage: node createUser.js "Name" email password role');
    process.exit();
  }

  if (!['mentor', 'admin'].includes(role)) {
    console.log('Role must be mentor or admin');
    process.exit();
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [name, email.toLowerCase(), passwordHash, role]
    );
    console.log('User created: ' + email);
  } catch (error) {
    console.log('Error: ' + error.message);
  }

  await pool.end();
}

createUser();