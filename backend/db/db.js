// Database creation and initialization
require("dotenv").config();
const mysql = require("mysql2/promise");
const auth = require("./authentication.js");

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
  
  await pool.query(`
    DROP TABLE IF EXISTS battle_history
  `);

  await pool.query(`
    DROP TABLE IF EXISTS tournament_history
  `);

  await pool.query(`
    DROP TABLE IF EXISTS active_battles;
  `);

  await pool.query(`
    DROP TABLE IF EXISTS looking_for_battle;
  `);

  // Drop dependent table first (if it exists)
  await pool.query(`
    DROP TABLE IF EXISTS tournament_participants;
  `);

  // Then drop tournaments so we can recreate with new schema
  await pool.query(`
    DROP TABLE IF EXISTS tournaments;
  `);

  // Tables are being dropped here, REMOVE IF NOT TESTING
  await pool.query(`
    DROP TABLE IF EXISTS events;
  `);

  await pool.query(`
    DROP TABLE IF EXISTS students;
  `);

  await pool.query(`
    DROP TABLE IF EXISTS user_prefs;
  `);

  await pool.query(`
    DROP TABLE IF EXISTS users;
  `);

  // Create users table
  // ADDED NEW FIELDS FOR XP AND LEVEL
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
    pid INT NOT NULL,
    university VARCHAR(32) DEFAULT NULL,
    major VARCHAR(32)  DEFAULT NULL,
    XP INT DEFAULT 0,
    gems INT DEFAULT 1000,
    canvasToken VARCHAR(70) DEFAULT NULL,
    KEY pid (pid),
    CONSTRAINT students_ibfk_1 FOREIGN KEY (pid) REFERENCES users (pid) ON DELETE CASCADE
  ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_0900_ai_ci;
`);

  //Create User Preferences Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_prefs (
      pid INT NOT NULL,
      darkMode BOOL NOT NULL DEFAULT FALSE,
      KEY pid (pid),
      CONSTRAINT fk_user_pid FOREIGN KEY (pid) REFERENCES users (pid) ON DELETE CASCADE
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci;
  `);

  //Create Triggers to ensure each User has an entry
  await pool.query(`
    CREATE TRIGGER IF NOT EXISTS after_user_insert
      AFTER INSERT ON users
      FOR EACH ROW
      BEGIN
        INSERT INTO user_prefs (pid)
        VALUES (NEW.pid);
      END
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

  // Create tournaments table
  // Each tournament type (daily, weekly, ranked) should have the same title
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tournaments (
      tid         INT NOT NULL AUTO_INCREMENT,
      title       VARCHAR(128) NOT NULL,    
      topics      VARCHAR(255) NOT NULL,
      reward      INT          NOT NULL,
      questionSet JSON  NULL,
      startTime   DATETIME     NOT NULL,
      endDate     DATETIME     NOT NULL,
      xpAwarded   BOOLEAN      NOT NULL DEFAULT FALSE,
      PRIMARY KEY (tid)
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci;
  `);

  // Create tournament_participants table with FKs to tournaments and students
  await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_participants (
          tid    INT NOT NULL,
          pid    INT NOT NULL,
          score  INT NOT NULL DEFAULT 0,
          hasPlayed BOOLEAN NOT NULL DEFAULT FALSE,
          PRIMARY KEY (tid, pid),

          CONSTRAINT fk_tp_tournament
              FOREIGN KEY (tid)
              REFERENCES tournaments (tid)
              ON DELETE CASCADE,

          CONSTRAINT fk_tp_student
              FOREIGN KEY (pid)
              REFERENCES students (pid)
              ON DELETE CASCADE
      ) ENGINE=InnoDB
        DEFAULT CHARSET=utf8mb4
        COLLATE=utf8mb4_0900_ai_ci;
    `);

  // Create a tournaments topic table for each major, storing the major, possible topics, and already used topics
  await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_topics (
        mid           INT NOT NULL AUTO_INCREMENT,
        major         VARCHAR(64) NOT NULL,
        topics        JSON NOT NULL,
        used_topics   JSON NULL,
        PRIMARY KEY (mid),
        UNIQUE KEY uk_major (major)
      )
      `);

  await pool.query(`
      CREATE TABLE IF NOT EXISTS looking_for_battle (
        pid INT NOT NULL,
        KEY pid (pid),
        CONSTRAINT fk_lfb_pid FOREIGN KEY (pid) REFERENCES users (pid) ON DELETE CASCADE
      )`);

  await pool.query(`
      CREATE TABLE IF NOT EXISTS active_battles (
        bid INT NOT NULL AUTO_INCREMENT,
        pid1 INT NOT NULL,
        pid2 INT NOT NULL,
        username1 VARCHAR(32) NOT NULL,
        username2 VARCHAR(32) NOT NULL,
        xp_gained_p1 INT NOT NULL DEFAULT 0,
        xp_gained_p2 INT NOT NULL DEFAULT 0,
        reward INT NOT NULL DEFAULT 1000,
        start_date DATE NOT NULL DEFAULT (CURRENT_DATE()),
        end_date DATE NOT NULL DEFAULT (DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)),
        PRIMARY KEY (bid),
        KEY (pid1),
        CONSTRAINT fk_btl_pid1 FOREIGN KEY (pid1) REFERENCES users (pid) ON DELETE CASCADE,
        KEY (pid2),
        CONSTRAINT fk_btl_pid2 FOREIGN KEY (pid2) REFERENCES users (pid) ON DELETE CASCADE
      )`);

  await pool.query(`
      CREATE TABLE IF NOT EXISTS battle_history (
        pid INT NOT NULL,
        opponent_username VARCHAR(32) NOT NULL,
        victory BOOLEAN NOT NULL,
        reward INT NOT NULL DEFAULT 1000,
        end_date DATE NOT NULL DEFAULT (CURRENT_DATE()),
        seen_popup BOOLEAN NOT NULL DEFAULT FALSE,
        KEY (pid),
        CONSTRAINT fk_btl_hist_pid FOREIGN KEY (pid) REFERENCES users (pid) ON DELETE CASCADE
      )`);

  await pool.query(`
      CREATE TABLE IF NOT EXISTS tournament_history (
        pid INT NOT NULL,
        tournament_name VARCHAR(128) NOT NULL,
        placement INT NOT NULL,
        reward INT NOT NULL DEFAULT 1000,
        end_date DATE NOT NULL DEFAULT (CURRENT_DATE()),
        seen_popup BOOLEAN NOT NULL DEFAULT FALSE,
        KEY (pid),
        CONSTRAINT fk_tmt_hist_pid FOREIGN KEY (pid) REFERENCES users (pid) ON DELETE CASCADE
      )`);

  // Drop + recreate tournament procedures
  await pool.query(`DROP PROCEDURE IF EXISTS create_tournament`);
  await pool.query(`DROP PROCEDURE IF EXISTS join_tournament`);
  await pool.query(`DROP PROCEDURE IF EXISTS finalize_tournament`);

  //-------------------------
  // List of Tournament procedures
  //-------------------------

  await pool.query(`
    CREATE PROCEDURE create_tournament(
      IN p_questionSet JSON,
      IN p_startTime   DATETIME,
      IN p_endDate     DATETIME,
      IN p_title       VARCHAR(128),
      IN p_topics      VARCHAR(255),
      IN p_reward      INT
    )
    BEGIN
      INSERT INTO tournaments (questionSet, startTime, endDate, title, topics, reward)
      VALUES (p_questionSet, p_startTime, p_endDate, p_title, p_topics, p_reward);
      SELECT LAST_INSERT_ID() AS tid;
    END
  `);

  await pool.query(`
  CREATE PROCEDURE join_tournament(
    IN p_tid INT,
    IN p_pid INT
  )
  BEGIN
    INSERT INTO tournament_participants (tid, pid)
    VALUES (p_tid, p_pid);
  END
`);

  // Procedure to award XP to top 3 participants and mark tournament as processed
  await pool.query(`
  CREATE PROCEDURE finalize_tournament(IN p_tid INT)
  BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE v_pid INT;
    DECLARE v_rank INT DEFAULT 0;

    -- Cursor selecting top 3 participants by score for that tournament
    DECLARE cur CURSOR FOR
      SELECT tp.pid
      FROM tournament_participants tp
      WHERE tp.tid = p_tid
      ORDER BY tp.score DESC
      LIMIT 3;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
      FETCH cur INTO v_pid;
      IF done THEN
        LEAVE read_loop;
      END IF;

      SET v_rank = v_rank + 1;

      -- Award XP based on placement
      IF v_rank = 1 THEN
        -- 1st place: +1000 XP
        UPDATE students
        SET XP = XP + 1000
        WHERE pid = v_pid;
      ELSEIF v_rank = 2 THEN
        -- 2nd place: +800 XP
        UPDATE students
        SET XP = XP + 800
        WHERE pid = v_pid;
      ELSEIF v_rank = 3 THEN
        -- 3rd place: +600 XP
        UPDATE students
        SET XP = XP + 600
        WHERE pid = v_pid;
      END IF;
    END LOOP;

    CLOSE cur;

    -- Mark this tournament as processed so we don't double-award XP
    UPDATE tournaments
    SET xpAwarded = TRUE
    WHERE tid = p_tid;
  END
`);
  //

  // Drop + recreate user procedures
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_first_name`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_username`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_student_by_username`);
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
    CREATE PROCEDURE get_student_by_username(IN p_username VARCHAR(32))
    BEGIN
      SELECT users.firstName, users.lastName, users.username, students.university, students.major, students.xp, students.gems, students.canvasToken
        FROM users
        INNER JOIN students
        ON users.pid = students.pid
        WHERE users.username = p_username;
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

    SELECT LAST_INSERT_ID();
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

  const majors = [
    "Computer Science",
    "Software Engineering",
    "Data Science",
    "Cybersecurity",
    "Information Systems",
    "Computer Engineering",
    "Electrical Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Industrial Eng",
    "Mathematics",
    "Statistics",
    "Physics",
    "Chemistry",
    "Biology",
    "Psychology",
    "Economics",
    "Business Admin",
    "Marketing",
    "Finance",
  ];

  const adjectives = [
    "Bright",
    "Curious",
    "Calm",
    "Swift",
    "Brave",
    "Clever",
    "Patient",
    "Steady",
    "Noble",
    "Focused",
    "Gentle",
    "Lively",
    "Quiet",
    "Radiant",
    "Sincere",
    "Thoughtful",
    "Vibrant",
    "Wise",
    "Diligent",
  ];

  const animals = [
    "Falcon",
    "Otter",
    "Panther",
    "Sparrow",
    "Fox",
    "Dolphin",
    "Hawk",
    "Lion",
    "Panda",
    "Badger",
    "Eagle",
    "Heron",
    "Lynx",
    "Robin",
    "Turtle",
    "Wolf",
    "Bison",
    "Jaguar",
    "Orca",
    "Stag",
  ];

  function generateUsername(index) {
    const adj = adjectives[randIntInclusive(0, adjectives.length - 1)];
    const animal = animals[randIntInclusive(0, animals.length - 1)];
    // index+1 helps keep usernames unique within this batch
    return `${adj}${animal}${index + 1}`;
  }

  // Clear child then parent to satisfy FK constraints
  await pool.query("DELETE FROM students");
  await pool.query("DELETE FROM users");
  await pool.query("ALTER TABLE users AUTO_INCREMENT = 1");

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Add Dev Users
    const devFNames = ["Mark", "Brock", "Ben"];
    const devLNames = ["Collins", "Handley", "Vukson"];
    const devUNames = ["mCollins", "bHandley", "bVukson"];
    const password = "pass";
    const hashedPassword = auth.encryptPassword(password);
    const university = "Penn State";
    const devMajor = "Computer Science";
    const canvasTok = process.env.CANVAS_TOKEN;

    for (let i = 0; i < 3; i++) {
      await conn.query(`CALL register(?, ?, ?, ?, ?, ?, ?)`, [
        devFNames[i],
        devLNames[i],
        devUNames[i],
        hashedPassword,
        university,
        devMajor,
        canvasTok,
      ]);
    }

    // Add mock users
    for (let i = 0; i < numUsers; i++) {
      const firstName = `FirstName${i}`;
      const lastName = `LastName${i}`;
      const username = generateUsername(i);
      const mockPassword = "1234"; // mock only
      const major =
        majors[randIntInclusive(0, majors.length - 1)];
      const xp = randIntInclusive(0, 10000);
      const uni = "Penn State";
      const mockCanvasTok = null;

      // insert into users
      const [res] = await conn.query(
        `INSERT INTO users (firstName, lastName, username, password)
         VALUES (?, ?, ?, ?)`,
        [firstName, lastName, username, mockPassword]
      );
      const pid = res.insertId;

      // insert into students (linked via pid)
      await conn.query(
        `INSERT INTO students (pid, university, major, XP, canvasToken)
         VALUES (?, ?, ?, ?, ?)`,
        [pid, uni, major, xp, mockCanvasTok]
      );
    }

    await conn.commit();
    console.log(`[DB] Mock users inserted (${numUsers}).`);
  } catch (err) {
    await conn.rollback();
    console.error("[DB] Mock insert failed:", err);
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, initDb, addMockUsers };
