// Database creation and initialization
require("dotenv").config();
const mysql = require("mysql2/promise");

// Creating DB connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
});

// Initializes database when server is started
async function initDb() {
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      pid       INT NOT NULL AUTO_INCREMENT,
      firstName VARCHAR(32) NOT NULL,
      lastName  VARCHAR(32) NOT NULL,
      username  VARCHAR(32) NOT NULL UNIQUE,
      password  CHAR(60)    NOT NULL,
      PRIMARY KEY (pid)
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Create students table
  await pool.query(`
  CREATE TABLE IF NOT EXISTS students (
    pid INT DEFAULT NULL,
    university VARCHAR(32) DEFAULT NULL,
    major VARCHAR(64)      DEFAULT NULL,
    XP INT DEFAULT 0,
    canvasToken VARCHAR(70) DEFAULT NULL,
    KEY pid (pid),
    CONSTRAINT students_ibfk_1 FOREIGN KEY (pid) REFERENCES users (pid)
  ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_0900_ai_ci;
`);

  // Create events table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      eid         INT NOT NULL AUTO_INCREMENT,
      title       VARCHAR(128) NOT NULL,
      subtitle    VARCHAR(255) NULL,
      description TEXT         NULL,
      location    VARCHAR(128) NULL,
      xp          INT          NOT NULL DEFAULT 0,
      PRIMARY KEY (eid)
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Drop + recreate user procedures
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_first_name`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_username`);
  await pool.query(`DROP PROCEDURE IF EXISTS login`);
  await pool.query(`DROP PROCEDURE IF EXISTS register`);

  //-------------------------
  // List of User procedures
  //-------------------------
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
    IN p_firstName  VARCHAR(32),
    IN p_lastName   VARCHAR(32),
    IN p_username   VARCHAR(32),
    IN p_password   CHAR(60),
    IN p_university VARCHAR(32),
    IN p_major      VARCHAR(64),
    IN p_canvasTok  VARCHAR(70)
  )
  BEGIN
    INSERT INTO users (firstName, lastName, username, password)
    VALUES (p_firstName, p_lastName, p_username, p_password);

    INSERT INTO students (pid, university, major, XP, canvasToken)
    VALUES (LAST_INSERT_ID(), p_university, p_major, 0, p_canvasTok);
  END
`);

  // Drop + recreate event procedures
  await pool.query(`DROP PROCEDURE IF EXISTS create_event`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_event`);
  await pool.query(`DROP PROCEDURE IF EXISTS list_events`);
  await pool.query(`DROP PROCEDURE IF EXISTS delete_event`);

  //-------------------------
  // List of Event procedures
  //-------------------------
  await pool.query(`
    CREATE PROCEDURE create_event(
      IN p_title       VARCHAR(128),
      IN p_subtitle    VARCHAR(255),
      IN p_description TEXT,
      IN p_location    VARCHAR(128),
      IN p_xp          INT
    )
    BEGIN
      INSERT INTO events (title, subtitle, description, location, xp)
      VALUES (p_title, p_subtitle, p_description, p_location, p_xp);
      SELECT LAST_INSERT_ID() AS eid;
    END
  `);

  await pool.query(`
    CREATE PROCEDURE get_event(IN p_eid INT)
    BEGIN
      SELECT * FROM events WHERE eid = p_eid;
    END
  `);

  await pool.query(`
    CREATE PROCEDURE list_events()
    BEGIN
      SELECT eid, title, subtitle, description, location, xp
      FROM events
      ORDER BY eid ASC;
    END
  `);

  await pool.query(`
    CREATE PROCEDURE delete_event(IN p_eid INT)
    BEGIN
      DELETE FROM events WHERE eid = p_eid;
      SELECT ROW_COUNT() AS affected;
    END
  `);

  console.log("[DB] Schema OK");
}

// Adds mock users to database based on numUsers
// IMPORTANT: clears tables first in FK-safe order
async function addMockUsers(numUsers) {
  function randIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

	// Clear child then parent to satisfy FK constraints
	await pool.query('DELETE FROM students');
	await pool.query('DELETE FROM users');
	await pool.query('ALTER TABLE users AUTO_INCREMENT = 1');

  const majors = [
    'Computer Science','Software Engineering','Data Science','Cybersecurity',
    'Information Systems','Computer Engineering','Electrical Engineering',
    'Mechanical Engineering','Civil Engineering','Industrial Engineering',
    'Math','Statistics','Physics','Chemistry','Biology','Psychology',
    'Economics','Business Administration','Marketing','Finance'
  ];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (let i = 0; i < numUsers; i++) {
      const firstName  = `FirstName${i}`;
      const lastName   = `LastName${i}`;
      const username   = `Username${i}`;
      const password   = '1234'; // mock only
      const major      = majors[randIntInclusive(0, majors.length - 1)];
      const xp         = randIntInclusive(0, 10000);
      const university = 'Penn State';
      const canvasTok  = null;

      // 1) insert into users
      const [res] = await conn.query(
        `INSERT INTO users (firstName, lastName, username, password)
         VALUES (?, ?, ?, ?)`,
        [firstName, lastName, username, password]
      );
      const pid = res.insertId;

      // 2) insert into students (linked via pid)
      await conn.query(
        `INSERT INTO students (pid, university, major, XP, canvasToken)
         VALUES (?, ?, ?, ?, ?)`,
        [pid, university, major, xp, canvasTok]
      );
    }

    await conn.commit();
    console.log(`[DB] Mock users inserted (${numUsers}).`);
  } catch (err) {
    await conn.rollback();
    console.error('[DB] Mock insert failed:', err);
    throw err;
  } finally {
    conn.release();
  }
}


module.exports = { pool, initDb, addMockUsers };
