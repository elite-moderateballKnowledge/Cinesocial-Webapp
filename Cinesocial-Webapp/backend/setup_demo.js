const bcrypt = require('bcrypt');
const { poolPromise } = require('./config/db');
require('dotenv').config();

async function setup() {
  const pool = await poolPromise;
  const hash = await bcrypt.hash('Password123!', 10);

  console.log("Creating basic user...");
  try {
    await pool.request()
      .input('username', 'basic_user')
      .input('email', 'basic@example.com')
      .input('password', hash)
      .query(`
        INSERT INTO Users (Username, Email, Password_hash, sub_ID)
        VALUES (@username, @email, @password, 1)
      `);
    console.log("Basic user created.");
  } catch (err) {
    if (err.message.includes('Violation of UNIQUE KEY constraint')) {
      console.log("Basic user already exists.");
    } else {
      console.error(err);
    }
  }

  console.log("Creating premium user...");
  try {
    await pool.request()
      .input('username', 'premium_user')
      .input('email', 'premium@example.com')
      .input('password', hash)
      .query(`
        INSERT INTO Users (Username, Email, Password_hash, sub_ID)
        VALUES (@username, @email, @password, 2)
      `);
    console.log("Premium user created.");
  } catch (err) {
    if (err.message.includes('Violation of UNIQUE KEY constraint')) {
      console.log("Premium user already exists.");
    } else {
      console.error(err);
    }
  }

  console.log("Done.");
  process.exit(0);
}

setup();
