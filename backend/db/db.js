// backend/db/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

// Create the pool (no top-level await needed)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // multipleStatements: true, // not required for CREATE PROCEDURE via driver
});

// Build/repair schema & procs
async function initDb() {
  // 1) users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      pid INT NOT NULL AUTO_INCREMENT,
      firstName VARCHAR(32) NOT NULL,
      lastName  VARCHAR(32) NOT NULL,
      username  VARCHAR(32) NOT NULL UNIQUE,
      password  CHAR(60)    NOT NULL,
      PRIMARY KEY (pid)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Drop procs if they exist
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_first_name`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_username`);
  await pool.query(`DROP PROCEDURE IF EXISTS login`);
  await pool.query(`DROP PROCEDURE IF EXISTS register`);

  // NOTE: No DELIMITER needed when using drivers.
  // Also: prefix params with p_ to avoid shadowing column names.

  await pool.query(`
    CREATE PROCEDURE get_user_by_first_name(IN p_firstName VARCHAR(32))
    BEGIN
      SELECT * FROM users WHERE firstName = p_firstName;
    END
  `);

  await pool.query(`
    CREATE PROCEDURE get_user_by_username(IN p_username VARCHAR(32))
    BEGIN
      SELECT * FROM users WHERE username = p_username;
    END
  `);

  await pool.query(`
    CREATE PROCEDURE login(IN p_username VARCHAR(32), IN p_password CHAR(60))
    BEGIN
      SELECT * FROM users
      WHERE username = p_username AND password = p_password;
    END
  `);

  await pool.query(`
    CREATE PROCEDURE register(
      IN p_firstName VARCHAR(32),
      IN p_lastName  VARCHAR(32),
      IN p_username  VARCHAR(32),
      IN p_password  CHAR(60)
    )
    BEGIN
      INSERT INTO users (firstName, lastName, username, password)
      VALUES (p_firstName, p_lastName, p_username, p_password);
    END
  `);

  // DB check
  await pool.query(`SELECT 1`);
  console.log('[DB] Schema OK');
}

module.exports = { pool, initDb };
