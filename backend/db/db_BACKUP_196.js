// backend/db/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');	//mysql2 here!!!

<<<<<<< HEAD
// Connection pool for database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Build/repair schema & stored procedures
async function initDb() {
  // ----------------------------
  // users table
  // ----------------------------
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      pid INT NOT NULL AUTO_INCREMENT,
      firstName VARCHAR(32) NOT NULL,
      lastName  VARCHAR(32) NOT NULL,
      username  VARCHAR(32) NOT NULL UNIQUE,
      password  CHAR(60)    NOT NULL,
	  xp		INT			NULL,
	  major		VARCHAR(64) NULL,
      PRIMARY KEY (pid)
    ) ENGINE=InnoDB
      DEFAULT CHARSET=utf8mb4
      COLLATE=utf8mb4_0900_ai_ci;
  `);

  // ----------------------------
  // events table
  // ----------------------------
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

  // Ensure description exists for older deployments (MySQL 8.0+ supports IF NOT EXISTS)
  await pool.query(`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS description TEXT NULL AFTER subtitle
  `).catch(() => {}); // ignore if unavailable/older MySQL

  // ----------------------------
  // Drop user procs (recreate cleanly)
  // ----------------------------
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_first_name`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_user_by_username`);
  await pool.query(`DROP PROCEDURE IF EXISTS login`);
  await pool.query(`DROP PROCEDURE IF EXISTS register`);

  // ----------------------------
  // User procs
  // ----------------------------
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

  // ----------------------------
  // Drop event procs 
  // ----------------------------
  await pool.query(`DROP PROCEDURE IF EXISTS create_event`);
  await pool.query(`DROP PROCEDURE IF EXISTS get_event`);
  await pool.query(`DROP PROCEDURE IF EXISTS list_events_between`);
  await pool.query(`DROP PROCEDURE IF EXISTS list_upcoming_events`);
  await pool.query(`DROP PROCEDURE IF EXISTS update_event`);
  await pool.query(`DROP PROCEDURE IF EXISTS delete_event`);
  await pool.query(`DROP PROCEDURE IF EXISTS list_events`);
  // ----------------------------
  // Event procs 
  // ----------------------------

  // Create event
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

  // Read single event
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


  // Delete event
  await pool.query(`
    CREATE PROCEDURE delete_event(IN p_eid INT)
    BEGIN
      DELETE FROM events WHERE eid = p_eid;
      SELECT ROW_COUNT() AS affected;
    END
  `);

  // DB check
  await pool.query(`SELECT 1`);
  console.log('[DB] Schema OK (users + events with description)');
}

//-----------
// Mock Data
//-----------

//Function to add a certain amount of users, with a random major and XP value
async function addMockUsers(numUsers){
	// Used to give each user random XP amount
  function randIntInclusive(min, max) {
  		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	let userNum = 0;

  //Clear out users table
  await pool.query('TRUNCATE TABLE users');


	//List of possible majors
	const majors = [
		'Computer Science',
		'Software Engineering',
		'Data Science',
		'Cybersecurity',
		'Information Systems',
		'Computer Engineering',
		'Electrical Engineering',
		'Mechanical Engineering',
		'Civil Engineering',
		'Industrial Engineering',
		'Math',
		'Statistics',
		'Physics',
		'Chemistry',
		'Biology',
		'Psychology',
		'Economics',
		'Business Administration',
		'Marketing',
		'Finance'
	];

 const rows = [];

  for (let i = 0; i < numUsers; ++i) {
    const firstName = `FirstName${userNum}`;
    const lastName  = `LastName${userNum}`;
    const username  = `Username${userNum}`;
	const psswd = "afdahjaklsdhfjkald";
    const major = majors[randIntInclusive(0, majors.length - 1)];
    const xp    = randIntInclusive(0, 10000);

    rows.push([firstName, lastName, username, psswd, major, xp]);

    ++userNum;
  }

  await pool.query(
    `INSERT INTO users (firstName, lastName, username, password, major, xp)
     VALUES ?`,
	 [rows]
     
  );
  console.log(`[DB] Mock users inserted (attempted ${rows.length}).`);
}

module.exports = { pool, initDb, addMockUsers};
=======
const host = process.env.MYSQL_HOST;
const username = process.env.MYSQL_USERNAME;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DB;

if (!host) throw new Error("Missing MYSQL_HOST in .env");
if (!username) throw new Error("Missing MYSQL_USERNAME in .env");
if (!password) throw new Error("Missing MYSQL_PASSWORD in .env");
if (!database) throw new Error("Missing MYSQL_DB in .env");

let dropQueries = [
    `DROP TABLE IF EXISTS users`,
    `DROP PROCEDURE IF EXISTS get_user_by_first_name`,
    `DROP PROCEDURE IF EXISTS get_user_by_username`,
    `DROP PROCEDURE IF EXISTS login`,
    `DROP PROCEDURE IF EXISTS register`
];

let createQueries = [
    `CREATE TABLE \`users\` (
        \`pid\` int NOT NULL AUTO_INCREMENT,
        \`firstName\` varchar(32) NOT NULL,
        \`lastName\` varchar(32) NOT NULL,
        \`username\` varchar(32) NOT NULL,
        \`password\` char(60) NOT NULL,
        PRIMARY KEY (\`pid\`)
        ) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `,
    `CREATE PROCEDURE \`get_user_by_first_name\`(IN firstName varchar(32))
        BEGIN
            SELECT * FROM users WHERE firstName = firstName;
        END;`,
    `CREATE PROCEDURE \`get_user_by_username\`(IN username varchar(32))
        BEGIN
            SELECT * FROM users WHERE username = username;
        END;`,
    `CREATE PROCEDURE \`login\`(IN username varchar(32), password char(60))
        BEGIN
            SELECT * FROM users WHERE username = username AND password = password;
        END;`,
    `CREATE PROCEDURE \`register\`(IN firstName varchar(32), lastName varchar(32), username varchar(32), password char(60))
        BEGIN
            insert into users (firstName, lastName, username, password) values (firstName, lastName, username, password);
        END;`
];

//Create a connection to the SQL Database
const dbPool = mysql.createPool({
    host: host,
    user: username,
    password: password,
    database: database,
});

dbPool.query("SELECT * FROM users", (err, rows) => {
    if(err) {
        dbPool.getConnection(function(err, con) {
            if (err) {
                console.log("[REMAKE] Connection Error: ", err);
            }
            dropQueries.forEach((query, index) => {
                con.query(query, function(err, results) {
                    if (err) {
                        console.log("[REMAKE] Drop Query Error: ", err)
                    }
                });
            });
            createQueries.forEach((query, index) => {
                con.query(query, function(err, results) {
                    console.log(query);
                    if (err) {
                        console.log("[REMAKE] Create Query Error: ", err)
                    }
                });
            })
        });
        console.log("Remade Database");
    }
    console.log(rows);
});
module.exports = dbPool;
>>>>>>> origin/User-Authentication
