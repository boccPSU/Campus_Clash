// Backend server

// Imports
const OpenAI = require("openai");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool, initDb, addMockUsers } = require("./db/db.js");
const { getSortedMajors, getSortedStudents } = require("./db/sortData.js");
const auth = require("./db/authentication.js");
const { decryptToken } = require("./db/authentication.js");

// Canvas proxy config
const BASE = process.env.CANVAS_BASE; // e.g. https://psu.instructure.com
const TOKEN = process.env.CANVAS_TOKEN; // Canvas generatd token
const PORT = Number(process.env.PORT || 3001);

if (!BASE) throw new Error("Missing CANVAS_BASE in .env");
if (!TOKEN) throw new Error("Missing CANVAS_TOKEN in .env");

// Create server that expects JSON
const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" })); //Bybass CORS

// Start Server
(async () => {
  try {
    await initDb(); // Initializies DB
    await addMockUsers(500); // Drops users table, comment out if you want to keep users
    startTournamentFinalizer(); // Starts tournament finalizer interval
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log(`Canvas proxy upstream: ${BASE}`);
    });
  } catch (e) {
    console.error("[DB] init failed:", e);
    process.exit(1);
  }
})();

// Checks for tournaments that have ended and finalizes them every minute
function startTournamentFinalizer() {
  const INTERVAL_MS = 5 * 1000; // check once per minute can teak if needed

  setInterval(async () => {
    try {
      // Find tournaments that have ended and haven't had XP awarded yet
      const [rows] = await pool.query(
        `SELECT tid
         FROM tournaments
         WHERE endDate <= NOW()
           AND xpAwarded = FALSE`
      );

      if (!rows || rows.length === 0) {
        return; // nothing to do this cycle
      }

      //console.log("[Finalizer] Found", rows.length, "expired tournaments.");

      for (const row of rows) {
        const tid = row.tid;
        //console.log("[Finalizer] Finalizing tournament tid =", tid);

        try {
          await pool.query("CALL finalize_tournament(?)", [tid]);
          //console.log("[Finalizer] finalize_tournament OK for tid =", tid);
        } catch (e) {
          //console.error(
          //"[Finalizer] Error finalizing tournament tid =",
          //tid,
          //e
          //);
        }
      }
    } catch (e) {
      console.error("[Finalizer] Error scanning for expired tournaments:", e);
    }
  }, INTERVAL_MS);
}

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "canvas-proxy" });
});

// Grabs all enpoints with /api/v1 and directs them to proxy to use Canvas API
app.get(/^\/api\/v1\/.*/, async (req, res) => {
  try {
    const token = req.headers["jwt-token"];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: missing token" });
    }

    const pid = decryptToken(token)?.pid;

    const [result] = await pool.query(`SELECT canvasToken FROM students WHERE pid = ?`, [pid]);

    const canvasToken = result[0]?.canvasToken;

    // Building Canvas request URL
    const upstreamUrl = `${BASE}${req.originalUrl}`;
    //console.log('[CanvasProxy] GET ->', upstreamUrl);

    // Grabbing info from Canva API using GET, while verifying canvas token
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${canvasToken}`,
        Accept: "application/json",
      },
    });

    const contentType =
      upstream.headers.get("content-type") || "application/json"; // Get Content type, default to json if not proviced
    const linkHeader = upstream.headers.get("link"); // Allows for pagenation
    if (linkHeader) res.set("Link", linkHeader);

    // Read response body as text and send back to client
    const bodyText = await upstream.text();
    res.status(upstream.status).type(contentType).send(bodyText);
  } catch (e) {
    console.error("[CanvasProxy] error:", e);
    res.status(500).type("text/plain").send(String(e));
  }
});

// POST /api/register
app.post("/api/register", async (req, res) => {
  // Get register info from request body
  const {
    firstName,
    lastName,
    username,
    password,
    university,
    major,
    canvasToken, // Canvas accsess token, (should hard code this in .env)
  } = req.body || {};

  // Make sure fields exist
  if (
    !firstName ||
    !lastName ||
    !username ||
    !password ||
    !university ||
    !major
  ) {
    return res.status(400).json({ successful: false, error: "Missing fields" });
  }

  try {
    // Check if username is taken
    const [lookupSets] = await pool.query("CALL get_user_by_username(?)", [
      username,
    ]);
    const rows = lookupSets?.[0] || [];
    if (rows.length > 0) {
      return res
        .status(409)
        .json({ successful: false, error: "Username taken" });
    }

    // Hash password
    const hashedPassword = auth.encryptPassword(password);
    if (!hashedPassword) {
      return res
        .status(500)
        .json({ successful: false, error: "Hashing failed" });
    }

    // Add user to users table and student row to students table via stored procedure
    let [result] = await pool.query("CALL register(?, ?, ?, ?, ?, ?, ?)", [
      firstName,
      lastName,
      username,
      hashedPassword,
      university,
      major,
      canvasToken ?? null,
    ]);

    let pid = result[0][0]['LAST_INSERT_ID()'];

    // Generate token for user
    const token = auth.generateToken(username, pid);

    // Set token in local storage on client side
    return res.status(201).json({ successful: true, token });
  } catch (e) {
    console.error("[BACKEND] register error:", e);
    return res
      .status(500)
      .json({ successful: false, error: "/register Error" });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ successful: false, error: "Missing fields" });
  }

  try {
    const [lookupSets] = await pool.query("CALL get_user_by_username(?)", [
      username,
    ]);
    const rows = lookupSets?.[0] || [];
    if (rows.length === 0) {
      return res
        .status(401)
        .json({ successful: false, error: "Invalid username or password" });
    } else if (rows.length > 1) {
      return res
        .status(401)
        .json({ successful: false, error: "Multiple Users with Username" });
    }

    const user = rows[0];
    const ok = auth.verifyPassword(password, user.password);
    if (!ok) {
      return res
        .status(401)
        .json({ successful: false, error: "Invalid username or password" });
    }

    const token = auth.generateToken(username, user.pid);
    return res.status(201).json({ successful: true, token });
  } catch (e) {
    console.error("[BACKEND] login error:", e);
    return res.status(500).json({ successful: false, error: "/login Error" });
  }
});

app.get("/api/profile", async (req, res) => {
  const token = req.headers["jwt-token"];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }
  // decryptToken now returns just the username (or null/undefined)
  const username = decryptToken(token)?.username;
  try {
    const [searchRows] = await pool.query("CALL get_student_by_username(?)", [
      username,
    ]);
    const rows = searchRows?.[0] || [];
    if (rows.length !== 1) {
      return res.status(401).json({ error: "Couldn't Find Unique Username." });
    }

    student = rows[0];
    return res.status(201).json({
      firstName: student.firstName,
      lastName: student.lastName,
      username: student.username,
      university: student.university,
      major: student.major,
      xp: student.xp,
      gems: student.gems,
      canvasToken: student.canvasToken
    });
  } catch (e) {
    console.error("[BACKEND] Profile Error: ", e);
    return res.status(500).json({ error: "/profile error" });
  }
});

app.post("/api/change-user-info", async (req, res) => {
  const token = req.headers["jwt-token"];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  const pid = decryptToken(token)?.pid;

  try {
    const {
      firstName,
      lastName,
      username,
      university,
      major,
      canvasToken
    } = req.body;

    const [results] = await pool.query(
      `UPDATE users, students
        SET users.firstName = ?,
            users.lastName = ?,
            users.username = ?,
            students.university = ?,
            students.major = ?,
            students.canvasToken = ?
        WHERE
            users.pid = students.pid
            AND users.pid = ?;`, 
            [firstName, lastName, username, university, major, canvasToken, pid]
    );

    // Generate token for user
    const token = auth.generateToken(username, pid);

    // Set token in local storage on client side
    return res.status(201).json({ successful: true, token });
  } catch (err) {
    console.error("[BACKEND] Change User Info Error: ", err);
    return res.status(500).json({error: "/change-user-info error"});
  }
})

app.get("/api/load-prefs", async (req, res) => {
  const token = req.headers["jwt-token"];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  const {pid} = decryptToken(token);

  try {
    const [results] = await pool.query(
      `SELECT * FROM user_prefs
        WHERE pid = (?)`,
        [pid]
    );

    const userPrefs = results[0];
    res.status(201).json({darkMode: !!userPrefs.darkMode});
  } catch (err) {
    console.error("[BACKEND] Load Preferences Error: ", err);
    return res.status(500).json({ error: "/load-prefs error" });
  }
})

app.post("/api/update-prefs", async (req, res) => {
  const token = req.headers["jwt-token"];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  const {pid} = decryptToken(token);

  try {
    const {
      darkMode
    } = req.body;

    const [results] = await pool.query(
      `UPDATE user_prefs
        SET darkMode = ?
        WHERE
            pid = ?;`, 
            [darkMode, pid]
    )
    return res.status(201).json({ successful: true });
  } catch (err) {
    console.error("[BACKEND] Update User Prefs Error: ", err);
    return res.status(500).json({error: "/update-prefs error"});
  }
});

app.post("/api/receive-xp", async (req, res) => {
  try {
    const { username, reward } = req.body;

    if (!username || typeof reward !== "number") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid username/reward",
      });
    }

    const [rows] = await pool.query(`CALL get_user_by_username(?)`, [username]);
    const studentRow = rows[0]?.[0];

    if (!studentRow) {
      return res
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    await pool.query(
      `UPDATE students
         SET xp = xp + ?
         WHERE pid = ?`,
      [reward, studentRow.pid]
    );

    console.log(
      "[BACKEND] Added",
      reward,
      "XP to user",
      username,
      "(pid:",
      studentRow.pid,
      ")"
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[BACKEND] /api/receive-xp error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
});


// POST /api/auth
app.post("/api/auth", (req, res) => {
  const token = req.headers["jwt-token"]; // matches your frontend convention
  try {
    if (!token)
      return res.status(401).json({ successful: false, error: "No token" });
    const ok = auth.verifyToken(token);
    return res.json({ successful: !!ok });
  } catch {
    return res.status(401).json({ successful: false, error: "/auth Error" });
  }
});

// POST /api/event
app.post("/api/event", async (req, res) => {
  const {
    title,
    subtitle = null,
    description = null,
    location = null,
    xp = 0,
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ successful: false, error: "Missing title" });
  }

  try {
    // CALL create_event(p_title, p_subtitle, p_description, p_location, p_xp)
    const [resultSets] = await pool.query("CALL create_event(?, ?, ?, ?, ?)", [
      title,
      subtitle,
      description,
      location,
      xp,
    ]);

    const eid = resultSets?.[0]?.eid;
    return res.status(201).json({ successful: true, eid });
  } catch (e) {
    console.error("[BACKEND] create event error:", e);
    return res.status(240).json({ successful: false, error: "/event Error" });
  }
});

// GET /api/events
app.get("/api/events", async (_req, res) => {
  try {
    const [rows] = await pool.query("CALL list_events()");
    const items = rows?.[0] ?? [];
    res.json(items);
  } catch (e) {
    console.error("[BACKEND] list events error:", e);
    res.status(100).json({ successful: false, error: "/events Error" });
  }
});

// GET /api/major-xp
app.get("/api/major-xp", async (_req, res) => {
  try {
    const rows = await getSortedMajors();
    res.status(278).json({ successful: true, rows });
  } catch (e) {
    console.error("[BACKEND] major-xp error:", e);
    res.status(500).json({ successful: false, error: "/major-xp Error" });
  }
});

app.get("/api/leaderboard/students", async (req, res) => {
  try {
    const rows = await getSortedStudents();

    // …or wrap in an object if you prefer consistency:
    return res.json({
      successful: true,
      rows,
    });
  } catch (e) {
    console.error("[API] /api/leaderboard/students error:", e);
    return res.status(500).json({
      successful: false,
      error: "Failed to load student leaderboard",
    });
  }
});

// Generates tournement questions using opneai wrapper
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// Generates qustions based on category, difficulty, and count
app.post("/api/generate-questions", async (req, res) => {
  //Expect a category, difficulty, and number of questions from req
  const {
    category = "Undefined",
    difficulty = "Undefined",
    count = 0,
  } = req.body;

  try {
    const completion = await client.chat.completions.create({
      // Specify LLM model
      model: "gpt-4.1-mini",

      // Format response into JSON we need
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quiz_questoins",
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                // Only return amount of questions we specify
                minItems: count,
                maxItems: count,
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard"],
                    },
                    question: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctIndex: {
                      type: "integer",
                      minimum: 0,
                      maximum: 3,
                    },
                  },
                  // All of these must be present for each question
                  required: [
                    "category",
                    "difficulty",
                    "question",
                    "options",
                    "correctIndex",
                  ],

                  // Disable any extra fields
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },

      // Converstion we send to LLM
      messages: [
        {
          // Define behavior and constraints for LLM
          role: "system",
          content:
            "You generate fair, factual tournament questions. " +
            "Answers must be unamiguous, current, and appropriate",
        },
        {
          // User message with question generation instructions
          role: "user",
          content:
            `Generate ${count} multiple-choice questions for the category ` +
            `"${category}" at "${difficulty}" difficulty. ` +
            "Each should:\n" +
            "- Have exactly 4 options.\n" +
            "- Exactly one correct answer.\n" +
            "- No 'All of the above' or 'None of the above'.\n" +
            "- Be suitable for a live tournament.\n" +
            "- Use the given category & difficulty fields accurately.",
        },
      ],

      // Controls how how creative the LLM is, lower values give more deterministic answers while higher cause more variety
      temperature: 0.7,
    });

    // The API returns an array of choices; we take the first one.
    // With json_schema, message.content should be valid JSON.
    const raw = completion.choices[0]?.message?.content;

    // If content is a string, parse it into a JS object.
    // (If it's already an object for some reason, just use it.)
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Send the structured data back to the client.
    // Frontend expects an object with a `questions` array.
    return res.json(data);
  } catch (err) {
    // Log any errors
    console.error(err);
    return res.status(500).json({ error: "Failed to generate questions" });
  }
});

// Creates a new tournament in the database if needed, or reuses an existing one

// First checks if an existing tournament with endDate in the future
// If tournament exists, then checks if the student's major matches the tournament's topics
// If no existing tournament or major doesn't match, creates a new tournament with generated questions
// If existing tournament found and major matches, returns existing tournament info
app.post("/api/create-tournament", async (req, res) => {
  // What we expect from frontend
  const {
    title,
    topics,
    reward, // XP given for tournament
    tournamentType, // "daily", "weekly", "ranked"
    endTime = null, // ms timestamp from frontend or null
    startTime,
    studentMajor,
  } = req.body || {};

  
  // Basic validation
  if (!title || !topics || reward == null || !tournamentType) {
    return res
      .status(400)
      .json({ successful: false, error: "Missing tournament fields" });
  }

  try {
    const now = new Date();

    //Try to find an existing tournament for this title that has an end date in the future
    const [existingRows] = await pool.query(
      `
        SELECT tid, startTime, endDate, topics
        FROM tournaments
        WHERE title = ?
        AND endDate > ?
      `,
      [title, now]
    );

    // If found existing tournament, check to make sure it matches the students major
    if (existingRows.length > 0) {
		console.log("Found existing tournament(s):", existingRows.length, " for title ", title);
		// Check each existing tournament for major match
		for (const tournament of existingRows) {
      		console.log("Found existing tournament:", tournament.tid, " of type", tournamentType, "checking major match " + studentMajor);
      		const majorMatch = await checkTournamentMajorMatch(
        	tournament.topics,
        	studentMajor
      );
      if (majorMatch == true) {
        const existing = tournament;
        console.log("Major matches, reusing tournament:", existing.tid, " of type ", tournamentType, "and topics " + topics);
        return res.json({
          successful: true,
          tid: existing.tid,
          startTime: existing.startTime,
          endDate: existing.endDate,
          tournamentType,
		  topics: existing.topics,
        });
      }}
    }

	console.log("No existing tournament found for major", studentMajor, ", creating new tournament of type ", tournamentType, " with topics " + topics);

    // Create end date and start time
    let endDate;
    let startDate = new Date(startTime);
    // If frontend passed an endTime (ms), use it; otherwise compute based on type
    if (endTime !== null && endTime !== undefined) {
      const endMs = Number(endTime);
      if (!Number.isFinite(endMs)) {
        // Fallback: try to parse it as a string date if it's not numeric
        endDate = new Date(endTime);
      } else {
        endDate = new Date(endMs);
      }
    } else {
      // Should always have an endTime from frontend
      console.log("No endTime provided, calculating based on type");

      // No endTime passed in base it on now
      if (tournamentType === "daily") {
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      } else if (tournamentType === "weekly") {
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (tournamentType === "ranked") {
        endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else {
        return res.status(400).json({
          successful: false,
          error: "Invalid tournamentType",
        });
      }
    }

    // Generate questions for the tournament

    // Can tweak these as needed
    // Daily will have 3 easy , 2 medium questions
    // Weekly will have 4 easy, 3 medium, 2 hard questions
    // Ranked will have 5 easy, 4 medium, 3 hard questions

    let questionConfig = [];

    if (tournamentType === "daily") {
      questionConfig = [
        { difficulty: "easy", count: 3 },
        { difficulty: "medium", count: 2 },
      ];
    } else if (tournamentType === "weekly") {
      questionConfig = [
        { difficulty: "easy", count: 4 },
        { difficulty: "medium", count: 3 },
        { difficulty: "hard", count: 2 },
      ];
    } else if (tournamentType === "ranked") {
      questionConfig = [
        { difficulty: "easy", count: 2 },
        //{ difficulty: "medium", count: 4 },
        //{ difficulty: "hard", count: 3 },
      ];
    } else {
      return res.status(400).json({
        successful: false,
        error: "Invalid tournamentType",
      });
    }

    const allQuestions = [];

    for (const cfg of questionConfig) {
      const { difficulty, count } = cfg;

      const { questions, error } = await generateQuestions({
        category: topics,
        difficulty,
        count,
      });

      if (error) {
        console.error(
          "[BACKEND] create-tournament generateQuestions error:",
          error
        );
        return res.status(500).json({
          successful: false,
          error: "Failed to generate questions for tournament",
        });
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        console.error(
          "[BACKEND] create-tournament: no questions returned for",
          difficulty
        );
        return res.status(500).json({
          successful: false,
          error: "No questions returned from generator",
        });
      }

      allQuestions.push(...questions);
    }

    // Optional: shuffle the questions so all the easies aren't bunched up
    //allQuestions.sort(() => Math.random() - 0.5);

    // Wrap in an object so /tournament/questions/:tid endpoint can return { questions: [...] } consistently
    const questionSetJson = JSON.stringify({ questions: allQuestions });

    // Call procedure to create tournament
    const [resultSets] = await pool.query(
      "CALL create_tournament(?, ?, ?, ?, ?, ?)",
      [
        questionSetJson, // p_questionSet
        startDate, // p_startTime (Date  MySQL DATETIME)
        endDate, // p_endDate   (Date  MySQL DATETIME)
        title,
        topics,
        reward,
      ]
    );

    const createdTournamentRow = resultSets[0]?.[0];
    const tid = createdTournamentRow?.tid;

    if (!tid) {
      console.error("[BACKEND] create-tournament: missing tid from procedure");
      return res.status(500).json({
        successful: false,
        error: "Failed to get created tournament id",
      });
    }

    console.log("Created new tournament:", tid);
    return res.status(201).json({
      successful: true,
      tid,
      startDate,
      endDate,
      tournamentType,
	  topics,
    });
  } catch (err) {
    console.error("[BACKEND] create-tournament error:", err);
    return res
      .status(520)
      .json({ successful: false, error: "Failed to create tournament" });
  }
});

// New endpoint to return the userName of the currently loggeed in user
app.get("/api/current-user", async (req, res) => {
  const token = req.headers["jwt-token"];
  //console.log("Current User Token: " + token);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized no token" });
  }
  const {username} = decryptToken(token);
  //console.log("Decrypted username in current user:", username);
  if (!username) {
    return res.status(401).json({ error: "Unauthorized no username" });
  }
  return res.json({ username });
});

// POSSIBLY REMOVE NOW //
// Endpoint to return the information on the current tournament based on logged in user
app.get("/api/current-tournament", async (req, res) => {
  const token = req.headers["jwt-token"];
  console.log("Current Tournament Token: " + token);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  // decryptToken now returns just the username (or null/undefined)
  const username = decryptToken(token)?.username;
  console.log("Decrypted username in current tournament:", username);
  if (!username) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }

  try {
    // Find the  tournament this user is participating in.
    const [rows] = await pool.query(
      `
            SELECT t.*
            FROM tournament_participants tp
            JOIN users u ON u.pid = tp.pid
            JOIN tournaments t ON t.tid = tp.tid
            WHERE u.username = ?
            LIMIT 1
            `,
      [username]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Tournament not found for user" });
    }

    return res.json({ tournament: rows[0] });
  } catch (err) {
    console.error("[BACKEND] current-tournament error:", err);
    return res.status(500).json({ error: "Failed to retrieve tournament" });
  }
});

// Allows currently logged in user to join a tournament
app.post("/api/join-tournament", async (req, res) => {
  try {
    const token = req.headers["jwt-token"];
    const { tid } = req.body || {};

    //console.log("[join-tournament] Token:", token);
    //console.log("[join-tournament] TID:", tid);

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    if (!tid) {
      return res.status(400).json({ error: "Missing tournament tid" });
    }

    const {username} = decryptToken(token);
    //console.log("[join-tournament] Decrypted username:", username);
    if (!username) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Look up user's pid
    const [userRows] = await pool.query(
      "SELECT pid FROM users WHERE username = ?",
      [username]
    );
    const user = userRows[0];
    if (!user) {
      return res.status(460).json({ error: "User not found" });
    }
    const pid = user.pid;

    // Check if already joined
    const [existingRows] = await pool.query(
      "SELECT 1 FROM tournament_participants WHERE tid = ? AND pid = ? LIMIT 1",
      [tid, pid]
    );

    if (existingRows.length > 0) {
      // already in this tournament
      return res.json(false);
    }

    // Not joined yet
    await pool.query("CALL join_tournament(?, ?)", [tid, pid]);

    // joined successfully
    return res.json(true);
  } catch (err) {
    console.error("[BACKEND] join-tournament error:", err);
    return res.status(500).json({ error: "Failed to join tournament" });
  }
});

// POSSIBLY REMOVE NOW //
// Check if tournament exists in tournaments table by tid
app.get("/api/tournament/tid-exists/:tid", async (req, res) => {
  const { tid } = req.params;

  try {
    // Try to find if at leadt one row exists
    const [rows] = await pool.query(
      "SELECT tid FROM TOURNAMENTS WHERE tid = ? LIMIT 1",
      [tid]
    );

    const exists = rows.length > 0;

    console.log("Tournament exists (tid):", tid, "=>", exists);

    res.json(exists);
  } catch (e) {
    console.error("Failed to check if tournament exists ERROR:", e);
    res.status(500).json({ error: "Failed to check tournament" });
  }
});

// POSSIBLY REMOVE NOW //
// Endpoint to add questions to tournament table in DB
app.post("/api/tournament/add-questions/:title", async (req, res) => {
  const title = req.params.title;
  const questions = req.body.questions;

  if (!title || !questions) {
    return res
      .status(400)
      .json({ successful: false, error: "Missing title or questions" });
  }

  try {
    const questionsJson = JSON.stringify(questions);

    // Add questions to tournament table
    const [result] = await pool.query(
      `UPDATE tournaments
           SET questionSet = ?
           WHERE title = ?`,
      [questionsJson, title]
    );

    // No tournament found
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ successful: false, error: "Tournament not found" });
    }

    return res.json({ successful: true });
  } catch (e) {
    console.log("Failed to add questions to tournament Error: " + e);
  }
});

// Gets questions from tournaments table
app.get("/api/tournament/questions/:tid", async (req, res) => {
  const tid = req.params.tid;

  try {
    const [rows] = await pool.query(
      "SELECT questionSet FROM tournaments WHERE tid = ? LIMIT 1",
      [tid]
    );

    // No tournament found with that tid
    if (!rows || rows.length === 0) {
      console.log(`No tournament found with tid: ${tid}`);
      return res.status(404).json({ error: "Tournament not found" });
    }

    const rawQuestionSet = rows[0].questionSet;

    // Tournament found but no questionSet
    if (!rawQuestionSet) {
      console.log(`Tournament ${tid} has no questionSet`);
      return res.status(204).json({ error: "Tournament has no question set" });
    }

    // Parse questionSet
    let parsed;
    try {
      if (typeof rawQuestionSet === "string") {
        parsed = JSON.parse(rawQuestionSet);
      } else {
        parsed = rawQuestionSet;
      }
    } catch (parseErr) {
      console.log("Failed to parse questionSet JSON:", parseErr);
      return res.status(500).json({ error: "Invalid question set JSON" });
    }

    // Unwrap the actual questions array
    let questions;
    if (Array.isArray(parsed)) {
      // DB stored a plain array
      questions = parsed;
    } else if (parsed && Array.isArray(parsed.questions)) {
      // DB stored { questions: [...] }
      questions = parsed.questions;
    } else {
      console.log(
        "Question set is not in expected format. Parsed value:",
        parsed
      );
      return res
        .status(500)
        .json({ error: "Question set is not in expected format" });
    }

    // Return questions
    return res.status(200).json({ questions });
  } catch (e) {
    console.log("Failed to get questions from tournaments table. Error:", e);
    return res.status(500).json({ error: "Server error fetching questions" });
  }
});

// Updates score in tournament_participants for a user in a given tournament
app.post("/api/tournament/update-score", async (req, res) => {
  try {
    // Get token from headers
    const token = req.headers["jwt-token"];
    const { tid, score } = req.body || {};

    if (!token) {
      return res
        .status(401)
        .json({ successful: false, error: "Missing token" });
    }

    // Validate tid and score
    if (!tid || typeof score !== "number") {
      return res
        .status(400)
        .json({ successful: false, error: "Missing or invalid tid/score" });
    }

    // Get username from token, then pid from users table
    const {username, pid} = decryptToken(token);

    // const [userRows] = await pool.query(
    //   "SELECT pid FROM users WHERE username = ?",
    //   [username]
    // );

    // if (userRows.length === 0) {
    //   return res
    //     .status(404)
    //     .json({ successful: false, error: "User not found" });
    // }

    //const pid = userRows[0].pid;

    // Update the participant's score in this tournament
    const [result] = await pool.query(
      `
        UPDATE tournament_participants
        SET score = ?
        WHERE tid = ? AND pid = ?
      `,
      [score, tid, pid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        successful: false,
        error: "User is not a participant in this tournament",
      });
    }

    return res.json({
      successful: true,
      tid,
      username,
      pid,
      score,
    });
  } catch (err) {
    console.error("[API] update-score error:", err);
    return res
      .status(500)
      .json({ successful: false, error: "Database error updating score" });
  }
});

// Gets all participating usernames in a tournament with their scores
app.post("/api/tournament/participating-users-info", async (req, res) => {
  try {
    const { tid } = req.body || {};

    if (!tid) {
      return res.status(400).json({
        successful: false,
        error: "Missing tournament tid",
      });
    }

    const [rows] = await pool.query(
      `
        SELECT u.username, tp.score
        FROM tournament_participants tp
        INNER JOIN users u ON u.pid = tp.pid
        WHERE tp.tid = ?
        ORDER BY tp.score DESC, u.username ASC
      `,
      [tid]
    );

    return res.json({
      successful: true,
      tid,
      participants: rows, // [{ username, score }, ...]
    });
  } catch (err) {
    console.error("[API] participating-users-info error:", err);
    return res.status(500).json({
      successful: false,
      error: "Database error fetching participants",
    });
  }
});

//Listen For Calls
app.listen(PORT, () => {
  console.log(`Server listening on Port ${PORT}`);
});

// Function to generate questions using OpenAI
const generateQuestions = async (req) => {
  // Expect a category, difficulty, and number of questions from req
  const { category = "Undefined", difficulty = "Undefined", count = 0 } = req;

  try {
    const completion = await client.chat.completions.create({
      // Specify LLM model
      model: "gpt-4.1-mini",

      // Format response into JSON we need
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "quiz_questoins",
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                // Only return amount of questions we specify
                minItems: count,
                maxItems: count,
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    difficulty: {
                      type: "string",
                      enum: ["easy", "medium", "hard"],
                    },
                    question: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                      minItems: 4,
                      maxItems: 4,
                    },
                    correctIndex: {
                      type: "integer",
                      minimum: 0,
                      maximum: 3,
                    },
                  },
                  // All of these must be present for each question
                  required: [
                    "category",
                    "difficulty",
                    "question",
                    "options",
                    "correctIndex",
                  ],

                  // Disable any extra fields
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },

      // Converstion we send to LLM
      messages: [
        {
          // Define behavior and constraints for LLM
          role: "system",
          content:
            "You generate fair, factual tournament questions. " +
            "Answers must be unamiguous, current, and appropriate",
        },
        {
          // User message with question generation instructions
          role: "user",
          content:
            `Generate ${count} multiple-choice questions for the category ` +
            `"${category}" at "${difficulty}" difficulty. ` +
            "Each should:\n" +
            "- Have exactly 4 options.\n" +
            "- Exactly one correct answer.\n" +
            "- No 'All of the above' or 'None of the above'.\n" +
            "- Be suitable for a live tournament.\n" +
            "- Use the given category & difficulty fields accurately.",
        },
      ],

      // Controls how how creative the LLM is, lower values give more deterministic answers while higher cause more variety
      temperature: 0.7,
    });

    // The API returns an array of choices; we take the first one.
    // With json_schema, message.content should be valid JSON.
    const raw = completion.choices[0]?.message?.content;

    // If content is a string, parse it into a JS object.
    // (If it's already an object for some reason, just use it.)
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    //console.log("[Generate-Questions] Questions: ", data);
    return data;
  } catch (err) {
    // Log any errors
    console.error(err);
    return { error: "Failed to generate questions" };
  }
};

const generateTopics = async (req) => {
  // Expect a major and min/max topic counts
  const { major = "Undefined Major", minCount = 10, maxCount = 20 } = req;

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",

      // We want a JSON object with a "topics" array
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "tournament_topics",
          schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                minItems: minCount,
                maxItems: maxCount,
                items: {
                  type: "string",
                },
              },
            },
            required: ["topics"],
            additionalProperties: false,
          },
        },
      },

      messages: [
        {
          role: "system",
          content:
            "You generate concise, distinct academic quiz topics for tournaments. " +
            "Each topic should be broad enough to support many easy, medium, and hard questions.",
        },
        {
          role: "user",
          content:
            `Generate between ${minCount} and ${maxCount} unique quiz topics for the college major ` +
            `"${major}". ` +
            "Each topic should:\n" +
            "- Be specific enough to suggest a focused area (e.g., 'Linked Lists' instead of just 'Data Structures').\n" +
            "- Be broad enough that many easy, medium, and hard questions could be written about it.\n" +
            "- Be unique (no duplicates, no trivial variations of the same phrase).\n" +
            "- Be returned as plain topic names only, without numbering or bullet characters.",
        },
      ],

      temperature: 0.7,
    });

    // Get JSON content from response
    const raw = completion.choices[0]?.message?.content;

    // Parse if it's a string
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;

    console.log("[Generate-Topics] Topics: ", data);
    return data;
  } catch (err) {
    console.error(err);
    return { error: "Failed to generate topics" };
  }
};

// Checks to see if user has joined a tournament
app.post("/api/tournament/has-joined", async (req, res) => {
  try {
    // Get user token
    const token = req.headers["jwt-token"];
    // Get tournament id
    const { tid } = req.body || {};

    // Check that we have a token and tid
    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    if (!tid) {
      return res.status(400).json({ error: "Missing tournament tid" });
    }

    // Get username, and pid
    const {username, pid} = decryptToken(token);

    const [userRows] = await pool.query(
      "SELECT pid FROM users WHERE username = ?",
      [username]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userRows[0];
    //const pid = user.pid;

    // Check to see if both exist in table
    const [existingRows] = await pool.query(
      "SELECT 1 FROM tournament_participants WHERE tid = ? AND pid = ? LIMIT 1",
      [tid, pid]
    );

    if (existingRows.length > 0) {
      return res.json(true);
    } else {
      return res.json(false);
    }
  } catch (e) {
    console.log("Error checking if user has joined Error: " + e);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Updates a user's score in the tournament_participants table
app.post("/api/tournament/update-score", async (req, res) => {
  try {
    //Get user token and body fields
    const token = req.headers["jwt-token"];
    const { score, tid } = req.body || {}; // title optional if you want later

    // Basic validation
    if (!token) {
      return res
        .status(401)
        .json({ successful: false, error: "Missing token" });
    }

    if (score === undefined || score === null) {
      return res
        .status(400)
        .json({ successful: false, error: "Missing score in request body" });
    }

    // Get username & pid
    const {username, pid} = decryptToken(token);

    // const [userRows] = await pool.query(
    //   "SELECT pid FROM users WHERE username = ?",
    //   [username]
    // );

    // const user = userRows[0];
    // if (!user) {
    //   return res
    //     .status(404)
    //     .json({ successful: false, error: "User not found" });
    // }

    // const pid = user.pid;

    // Update this participant's score for this tournament
    const [result] = await pool.query(
      `
        UPDATE tournament_participants
        SET score = ?
        WHERE tid = ? AND pid = ?
      `,
      [score, tid, pid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        successful: false,
        error: "Participant record not found for this tournament",
      });
    }

    return res.json({
      successful: true,
      tid,
      username,
      score,
    });
  } catch (err) {
    console.error("[API] update-score error:", err);
    return res.status(500).json({
      successful: false,
      error: "Failed to update tournament score",
    });
  }
});

// Used to create a list of possible tournament topics depending on major
app.post("/api/tournament/generate-topics", async (req, res) => {
  try {
    // Expect to get a major
    const { major } = req.body;

    // Check if we have major and if it already exists in database
    if (!major) {
      return res.status(400).json({
        successful: false,
        error: "No major passed into create topics endpoint",
      });
    }

    // Check if this major already has topics
    const [rows] = await pool.query(
      "SELECT 1 FROM tournament_topics WHERE major = ? LIMIT 1",
      [major]
    );

    if (rows.length > 0) {
      //console.log("Major already has topics, exiting endpoint");
      return res.json({
        successful: true,
		topicsGenerated: false,
        skipped: true,
        message: "Topics already exist for this major",
      });
    }

    // Call chatgpt to generate topics
    const { topics, error } = await generateTopics({
      major,
      minCount: 10,
      maxCount: 20,
    });

    if (error) {
      return res.status(500).json({
        successful: false,
        error: "Failed to generate topics",
      });
    }

    if (!Array.isArray(topics) || topics.length === 0) {
      return res.status(500).json({
        successful: false,
        error: "No topics returned from generator",
      });
    }

    // Add topics to tournament_topics table
    await pool.query(
      "INSERT INTO tournament_topics (major, topics, used_topics) VALUES (?, ?, ?)",
      [major, JSON.stringify(topics), JSON.stringify([])]
    );

    return res.json({
      successful: true,
	  topicsGenerated: true,
      major,
      topics,
    });
  } catch (e) {
    console.log("Failed to add topics to major. Error:", e);
    return res.status(500).json({
      successful: false,
      error: "Internal server error while creating topics",
    });
  }
});

// Returns topics from tournament_topics that have not been used yet.
// If all topics have been used, clears used_topics and returns all topics.
app.post("/api/tournament/get-topics", async (req, res) => {
  try {
    const { major } = req.body;

    if (!major) {
      return res.status(400).json({
        successful: false,
        error: "No major passed into get unused topics endpoint",
      });
    }

    // Get topics + used_topics for this major
    const [rows] = await pool.query(
      "SELECT topics, used_topics FROM tournament_topics WHERE major = ? LIMIT 1",
      [major]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        successful: false,
        error: "No topics found for this major",
      });
    }

    const row = rows[0];

    // Parse helper function
    function parseTopicsField(raw) {
      if (raw == null) return [];

      // If mysql2 already parsed JSON into a JS value
      if (Array.isArray(raw)) {
        return raw;
      }

      if (typeof raw === "object") {
        // JSON column can sometimes come back as object
        return Array.isArray(raw) ? raw : Object.values(raw);
      }

      if (typeof raw === "string") {
        // Try JSON string first
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          // JSON but not array wrap
          return [parsed];
        } catch {
          // Fallback: comma-separated list like "Graph Algo, OS"
          return raw
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        }
      }

      return [];
    }

    function parseUsedTopicsField(raw) {
      if (raw == null) return [];

      if (Array.isArray(raw)) {
        return raw;
      }

      if (typeof raw === "object") {
        return Array.isArray(raw) ? raw : Object.values(raw);
      }

      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          return raw
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
        }
      }

      return [];
    }

    // Parse JSON columns safely
    const allTopics = parseTopicsField(row.topics);
    const usedTopics = parseUsedTopicsField(row.used_topics);

    if (!Array.isArray(allTopics)) {
      return res.status(500).json({
        successful: false,
        error: "Topics data is not in array format",
      });
    }

    // Filter out used topics
    const usedSet = new Set(usedTopics);
    let unusedTopics = allTopics.filter((t) => !usedSet.has(t));

    // If everything has been used, reset used_topics and return all topics
    if (unusedTopics.length === 0) {
      await pool.query(
        "UPDATE tournament_topics SET used_topics = ? WHERE major = ?",
        [JSON.stringify([]), major]
      );

      unusedTopics = allTopics.slice();
    }

    return res.json({
      successful: true,
      major,
      topics: unusedTopics,
    });
  } catch (e) {
    console.error("Failed to get unused topics for major. Error:", e);
    return res.status(500).json({
      successful: false,
      error: "Internal server error while fetching unused topics",
    });
  }
});

// Adds a topic to used topics
app.post("/api/tournament/add-used-topic", async (req, res) => {
  try {
    const { major, topic } = req.body;

    if (!major || !topic) {
      return res.status(400).json({ successful: false });
    }

    // Get current used_topics
    const [rows] = await pool.query(
      "SELECT used_topics FROM tournament_topics WHERE major = ? LIMIT 1",
      [major]
    );

    if (rows.length === 0) {
      return res.status(404).json({ successful: false });
    }

    const row = rows[0];
    const rawUsed = row.used_topics;

    // Safely parse used topics
    let used = [];
    if (rawUsed == null) {
      used = [];
    } else if (Array.isArray(rawUsed)) {
      // mysql2 may already give us an array for JSON columns
      used = rawUsed;
    } else if (typeof rawUsed === "object") {
      // If it's some object, try to turn it into an array of values
      used = Array.isArray(rawUsed) ? rawUsed : Object.values(rawUsed);
    } else if (typeof rawUsed === "string") {
      // String: could be JSON or legacy comma-separated
      try {
        const parsed = JSON.parse(rawUsed);
        used = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        // Fallback: treat as comma-separated text
        used = rawUsed
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
      }
    }

    // Add the new topic to used if not already present
    if (!used.includes(topic)) {
      used.push(topic);
    }

    await pool.query(
      "UPDATE tournament_topics SET used_topics = ? WHERE major = ?",
      [JSON.stringify(used), major]
    );

    return res.json({ successful: true });
  } catch (e) {
    console.error("Error adding used topic:", e);
    return res.status(500).json({ successful: false });
  }
});

// Updates the end date for a tournament by tid
app.post("/api/tournament/update-end-date", async (req, res) => {
  const { tid, endDate } = req.body || {};

  if (!tid || !endDate) {
    return res
      .status(400)
      .json({ successful: false, error: "Missing tid or endDate" });
  }

  try {
    // Update the endDate in the tournaments table
    await pool.query("UPDATE tournaments SET endDate = ? WHERE tid = ?", [
      new Date(endDate),
      tid,
    ]);

    return res.json({ successful: true });
  } catch (err) {
    console.error("[API] update-end-date error:", err);
    return res
      .status(500)
      .json({ successful: false, error: "Database error updating endDate" });
  }
});

// Get a tournament's end date by tid
app.post("/api/tournament/end-date", async (req, res) => {
  const { tid } = req.body || {};

  if (!tid) {
    return res.status(400).json({ successful: false, error: "Missing tid" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT endDate FROM tournaments WHERE tid = ?",
      [tid]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ successful: false, error: "Tournament not found" });
    }

    return res.json({
      successful: true,
      endDate: rows[0].endDate,
    });
  } catch (err) {
    console.error("[API] get end-date error:", err);
    return res.status(500).json({ successful: false, error: "Database error" });
  }
});

// Returns the most recent daily, weekly, and ranked tournaments
app.post("/api/tournament/current-tournaments", async (req, res) => {
  try {
    const [dailyRows] = await pool.query(
      `
        SELECT tid, title, topics, reward, endDate
        FROM tournaments
        WHERE title = 'Daily Tournament'
        ORDER BY endDate DESC
        LIMIT 1
      `
    );

    const [weeklyRows] = await pool.query(
      `
        SELECT tid, title, topics, reward, endDate
        FROM tournaments
        WHERE title = 'Weekly Tournament'
        ORDER BY endDate DESC
        LIMIT 1
      `
    );

    const [rankedRows] = await pool.query(
      `
        SELECT tid, title, topics, reward, endDate
        FROM tournaments
        WHERE title = 'Ranked Tournament'
        ORDER BY endDate DESC
        LIMIT 1
      `
    );

    return res.json({
      successful: true,
      daily: dailyRows[0] || null,
      weekly: weeklyRows[0] || null,
      ranked: rankedRows[0] || null,
    });
  } catch (err) {
    console.error("[BACKEND] current-tournaments error:", err);
    return res.status(500).json({
      successful: false,
      error: "Failed to load current tournaments",
    });
  }
});

// Updates ranked tournament by carrying top portion of leaderboard to next tournament
app.post("/api/tournament/update-ranked-leaderboard", async (req, res) => {
  try {
    const { oldTid, newTid } = req.body || {};

    console.log(
      "[Ranked Leaderboard] Updating from oldTid:",
      oldTid,
      "to newTid:",
      newTid
    );

    if (!oldTid || !newTid) {
      return res.status(400).json({
        successful: false,
        error: "Missing oldTid or newTid",
      });
    }

    // Get all participants and their scores from the OLD tournament
    const [rows] = await pool.query(
      `
        SELECT u.username, tp.pid, tp.score
        FROM tournament_participants tp
        INNER JOIN users u ON u.pid = tp.pid
        WHERE tp.tid = ?
        ORDER BY tp.score DESC, u.username ASC
      `,
      [oldTid]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        successful: false,
        error: "No participants found for this tournament",
      });
    }

    const total = rows.length;

    // Check if we've already processed this tournament (round or final)
    const [tournamentRows] = await pool.query(
      "SELECT xpAwarded FROM tournaments WHERE tid = ?",
      [oldTid]
    );

    if (!tournamentRows || tournamentRows.length === 0) {
      return res.status(404).json({
        successful: false,
        error: "Tournament not found for oldTid",
      });
    }

    const alreadyProcessed = !!tournamentRows[0].xpAwarded;

    if (alreadyProcessed) {
      console.log(
        "[Ranked Leaderboard] Tournament",
        oldTid,
        "already processed (xpAwarded=1). Skipping."
      );
      return res.json({
        successful: true,
        continues: total > 3, // informational
        oldTid,
        newTid,
        totalParticipants: total,
        winners: total <= 3 ? rows : [],
      });
    }

    // ===== FINAL TOURNAMENT CASE (<= 3 players) → PAY XP & MARK PROCESSED =====
    if (total <= 3) {
      console.log(
        "[Ranked Leaderboard] 3 or fewer players remain, ending tournament & awarding XP."
      );

      // XP payouts: 1st, 2nd, 3rd
      const xpByPlace = [1000, 800, 600];

      for (let i = 0; i < rows.length && i < 3; i++) {
        const award = xpByPlace[i];
        const pid = rows[i].pid;

        // Increment XP for this student
        await pool.query("UPDATE students SET XP = XP + ? WHERE pid = ?", [
          award,
          pid,
        ]);

        // Attach award info so frontend can see who got what (optional)
        rows[i].xpAward = award;
      }

      // Mark this tournament as processed so no background job (or repeat call) double-awards XP
      await pool.query("UPDATE tournaments SET xpAwarded = 1 WHERE tid = ?", [
        oldTid,
      ]);

      return res.json({
        successful: true,
        continues: false, // tournament ended
        oldTid,
        newTid,
        totalParticipants: total,
        winners: rows, // includes xpAward if just awarded
      });
    }

    // ===== ROUND CASE (> 3 players) → ELIMINATE, CARRY FORWARD, NO XP =====
    let keepCount;

    if (total === 4) {
      console.log(
        "[Ranked Leaderboard] 4 players remain, carrying top 3 forward."
      );
      keepCount = 3;
    } else if (total % 2 === 0) {
      console.log(
        `[Ranked Leaderboard] ${total} players remain, carrying top ${
          total / 2
        } forward.`
      );
      keepCount = total / 2;
    } else {
      console.log(
        `[Ranked Leaderboard] ${total} players remain, carrying top ${Math.ceil(
          total / 2
        )} forward.`
      );
      keepCount = Math.ceil(total / 2);
    }

    const topParticipants = rows.slice(0, keepCount);
    const eliminatedParticipants = rows.slice(keepCount);
    const topPids = topParticipants.map((p) => p.pid);

    if (topPids.length > 0) {
      // Reset score for new round (0)
      const values = topPids.map((pid) => [newTid, pid, 0]);

      await pool.query(
        `
          INSERT IGNORE INTO tournament_participants (tid, pid, score)
          VALUES ?
        `,
        [values]
      );
    }

    // IMPORTANT:
    // Even though we did NOT give XP, we still mark this round as "processed"
    // so your background XP job will ignore it.
    await pool.query("UPDATE tournaments SET xpAwarded = 1 WHERE tid = ?", [
      oldTid,
    ]);

    return res.json({
      successful: true,
      continues: true, // tournament continues to next round
      oldTid,
      newTid,
      totalParticipants: total,
      keepCount,
      carriedParticipants: topParticipants,
      eliminatedParticipants,
    });
  } catch (err) {
    console.error("[API] update-ranked-leaderboard error:", err);
    return res.status(500).json({
      successful: false,
      error: "Failed to update ranked leaderboard",
    });
  }
});

// Get total XP for a given username
app.post("/api/users/xp", async (req, res) => {
  const { username } = req.body || {};

  if (!username) {
    return res
      .status(400)
      .json({ successful: false, error: "Missing username" });
  }

  try {
    const [rows] = await pool.query(
      `
      SELECT s.XP AS xp
      FROM students s
      INNER JOIN users u ON s.pid = u.pid
      WHERE u.username = ?
      LIMIT 1
      `,
      [username]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ successful: false, error: "User not found" });
    }

    const xp = rows[0].xp ?? 0;

    return res.json({
      successful: true,
      username,
      xp,
    });
  } catch (e) {
    console.error("[BACKEND] /api/users/xp error:", e);
    return res
      .status(500)
      .json({ successful: false, error: "Failed to fetch XP" });
  }
});

// Get the logged-in student's major
app.get("/api/student-major", async (req, res) => {
  try {
    // Get JWT from headers
    const token = req.headers["jwt-token"];
    if (!token) {
      return res.status(401).json({
        successful: false,
        error: "Missing token",
      });
    }

    // Decode token into username
    //   Adjust this line depending on how you named it in authentication.js
    const {username} = decryptToken(token);

    if (!username) {
      return res.status(401).json({
        successful: false,
        error: "Invalid token",
      });
    }

    //Look up student's major
    const [rows] = await pool.query(
      `
      SELECT
        COALESCE(NULLIF(TRIM(s.major), ''), 'Unknown') AS major
      FROM students s
      INNER JOIN users u ON u.pid = s.pid
      WHERE u.username = ?
      LIMIT 1;
      `,
      [username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        successful: false,
        error: "Student not found",
      });
    }

    return res.json({
      successful: true,
      username,
      major: rows[0].major,
    });
  } catch (e) {
    console.error("[API] /api/student-major error:", e);
    return res.status(500).json({
      successful: false,
      error: "Failed to fetch student major",
    });
  }
});

// Helper function to get major associated with a tournaments topcics, and check if that major matches the logged in student's major
async function checkTournamentMajorMatch(topics, studentMajor) {
  console.log(
    "Entering checkTournamentMajorMatch with topics:",
    topics,
    "and studentMajor:",
    studentMajor
  );

  const [rows] = await pool.query(
    `SELECT major FROM tournament_topics WHERE JSON_CONTAINS(topics, JSON_QUOTE(?))`,
    [topics]
  );

  if (rows.length === 0) {
    console.log("No major found for the given topics.");
    return false;
  }

  const tournamentMajor = rows[0].major;

  if (tournamentMajor === studentMajor) {
    console.log("Majors match.");
    return true;
  } else {
    console.log("Majors do not match.");
    return false;
  }
}

// Adds gems to a student's account
app.post("/api/gems/add", async (req, res) => {
  try {
    const { username, amount } = req.body;

    if (!username) {
      return res
        .status(400)
        .json({ successful: false, error: "Missing username" });
    }

    const gemsToAdd = Number(amount);
    if (!Number.isFinite(gemsToAdd) || gemsToAdd <= 0) {
      return res
        .status(400)
        .json({ successful: false, error: "Amount must be a positive number" });
    }

    // Atomically add gems to this user
    await pool.query(
      `
      UPDATE students s
      JOIN users u ON s.pid = u.pid
      SET s.gems = s.gems + ?
      WHERE u.username = ?
      `,
      [gemsToAdd, username]
    );

    // Get updated gem count
    const [rows] = await pool.query(
      `
      SELECT s.gems
      FROM students s
      JOIN users u ON s.pid = u.pid
      WHERE u.username = ?
      `,
      [username]
    );

    if (!rows || rows.length === 0) {
      return res
        .status(404)
        .json({ successful: false, error: "Student not found" });
    }

    const newGems = rows[0].gems ?? 0;

    return res.status(200).json({
      successful: true,
      gems: newGems,
    });
  } catch (e) {
    console.error("[BACKEND] /api/gems/add error:", e);
    return res
      .status(500)
      .json({ successful: false, error: "Internal server error" });
  }
});


// Remove gems endpoint
app.post("/api/gems/remove", async (req, res) => {
  try {
    console.log("[GEMS] /api/gems/remove called with body:", req.body);
    const { username, amount } = req.body;

    if (!username) {
      console.log("[GEMS] Missing username in request body");
      return res
        .status(400)
        .json({ successful: false, error: "Missing username" });
    }

    const gemsToRemove = Number(amount);
    if (!Number.isFinite(gemsToRemove) || gemsToRemove <= 0) {
      console.log("[GEMS] Invalid amount to remove:", amount);
      return res.status(400).json({
        successful: false,
        error: "Amount must be a positive number",
      });
    }

    // Look up pid from users table
    const [userRows] = await pool.query(
      `SELECT pid FROM users WHERE username = ?`,
      [username]
    );

    console.log("[GEMS] User lookup result for username", username, "=>", userRows);

    if (!userRows || userRows.length === 0) {
      console.log("[GEMS] No user found for username:", username);
      return res
        .status(404)
        .json({ successful: false, error: "User not found" });
    }

    const pid = userRows[0].pid;
    console.log("[GEMS] Found pid for username", username, "=>", pid);

    //  update on students: only subtract if enough gems
    const [updateResult] = await pool.query(
      `
      UPDATE students
      SET gems = gems - ?
      WHERE pid = ?
        AND gems >= ?
      `,
      [gemsToRemove, pid, gemsToRemove]
    );

    console.log(
      "[GEMS] UpdateResult for pid",
      pid,
      "=>",
      JSON.stringify(updateResult)
    );

    if (updateResult.affectedRows === 0) {
      console.log(
        "[GEMS] Not enough gems (or no student row) for pid:",
        pid
      );
      return res.status(200).json({
        successful: false,
        notEnoughGems: true,
        message: "Not enough gems to complete this operation.",
      });
    }

    // Fetch new gem balance from students
    const [rows] = await pool.query(
      `
      SELECT gems
      FROM students
      WHERE pid = ?
      `,
      [pid]
    );

    console.log("[GEMS] Gem lookup result for student pid", pid, "=>", rows);

    if (!rows || rows.length === 0) {
      console.log("[GEMS] Student not found for pid:", pid);
      return res
        .status(404)
        .json({ successful: false, error: "Student not found" });
    }

    const newGems = rows[0].gems ?? 0;
    console.log(
      "[GEMS] Successfully removed",
      gemsToRemove,
      "gems for pid",
      pid,
      "new balance:",
      newGems
    );

    return res.status(200).json({
      successful: true,
      gems: newGems,
    });
  } catch (e) {
    console.error("[BACKEND] /api/gems/remove error:", e);
    return res
      .status(500)
      .json({ successful: false, error: "Internal server error" });
  }
});
