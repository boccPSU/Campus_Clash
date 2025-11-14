// Backend server

// Imports
const OpenAI = require("openai");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { pool, initDb, addMockUsers } = require("./db/db.js");
const { getSortedMajors } = require("./db/sortData.js");
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
    await addMockUsers(1000); // Drops users table, comment out if you want to keep users

    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log(`Canvas proxy upstream: ${BASE}`);
    });
  } catch (e) {
    console.error("[DB] init failed:", e);
    process.exit(1);
  }
})();

// Healthcheck
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "canvas-proxy" });
});

// Grabs all enpoints with /api/v1 and directs them to proxy to use Canvas API
app.get(/^\/api\/v1\/.*/, async (req, res) => {
  try {
    // Building Canvas request URL
    const upstreamUrl = `${BASE}${req.originalUrl}`;
    //console.log('[CanvasProxy] GET ->', upstreamUrl);

    // Grabbing info from Canva API using GET, while verifying canvas token
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
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
    await pool.query("CALL register(?, ?, ?, ?, ?, ?, ?)", [
      firstName,
      lastName,
      username,
      hashedPassword,
      university,
      major,
      canvasToken ?? null,
    ]);

    // Generate token for user
    const token = auth.generateToken(username);

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

    const token = auth.generateToken(username);
    return res.status(201).json({ successful: true, token });
  } catch (e) {
    console.error("[BACKEND] login error:", e);
    return res.status(500).json({ successful: false, error: "/login Error" });
  }
});

app.post("api/profile", async (req, res) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({ error: "Missing Parameters" });
  }

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
      univeristy: student.university,
      major: student.major,
      xp: student.xp,
    });
  } catch (e) {
    console.error("[BACKEND] Profile Error: ", e);
    return res.status(500).json({ error: "/profile error" });
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

//Listen For Calls
app.listen(PORT, () => {
  console.log(`Server listening on Port ${PORT}`);
});

// Generates tournement questions using opneai wrapper

const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// Create endopoint to send prompt to LLM
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

// Creates a new tournament in the database if tournament title does not exist
app.post("/api/create-tournament", async (req, res) => {
  const {
    title,
    topics,
    difficulty,
    reward,
    questionSet = null, // Null for now
  } = req.body || {};

  // Basic validation
  if (!title || !topics || !difficulty || reward == null) {
    return res.status(400).json({ error: "Missing tournament fields" });
  }

  try {
    // Check to see if title already exists in tournaments table
    const [existing] = await pool.query(
      "SELECT tid FROM tournaments WHERE title = ?",
      [title]
    );
    if (existing.length > 0) {
      return res.status(401).json({ error: "Tournament already exists" });
    }

    // Call create_tournament stored procedure
    // (p_questionSet, p_startTime, p_title, p_topics, p_difficulty, p_reward)
    const [resultSets] = await pool.query(
      "CALL create_tournament(?, NOW(), ?, ?, ?, ?)",
      [
        questionSet, // can be null
        title,
        topics,
        difficulty,
        reward,
      ]
    );
    console.log(`[DB] Tournament created: ${title}`);
    return res.status(201).json({ successful: true });
  } catch (err) {
    console.error("[BACKEND] create-tournament error:", err);
    return res.status(520).json({ error: "Failed to create tournament" });
  }
});

// New endpoint to return the userName of the currently loggeed in user
app.get("/api/current-user", async (req, res) => {
  const token = req.headers["jwt-token"]; // matches your frontend convention
  const username = decryptToken(token);
  if (!username) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.json({ username });
});

// Endpoint to return the information on the current tournament based on logged in user
app.get("/api/current-tournament", async (req, res) => {
  const token = req.headers["jwt-token"];
  console.log("Current Tournament Token: " + token);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }

  // decryptToken now returns just the username (or null/undefined)
  const username = decryptToken(token);
  console.log("Decrypted username in current tournament:", username);
  if (!username) {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }

  try {
    // Find the (single) tournament this user is participating in.
    // If you truly only ever have one active tournament total,
    // this will just pick that one for whoever is in it.
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

// Allows currently logged in user to join the current tournament
app.post("/api/join-tournament", async (req, res) => {
  try {
    const token = req.headers["jwt-token"];
    console.log("Join Tournament Token: " + token);

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    // This should return the username string based on your implementation
    const username = decryptToken(token);
    console.log("Decrypted username in join tournament:", username);
    if (!username) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Look up user's pid
    const [userRows] = await pool.query(
      "SELECT pid FROM users WHERE username = ?",
      [username]
    );
    const user = userRows[0];
    console.log("User found for join tournament:", user);
    if (!user) {
      return res.status(460).json({ error: "User not found" });
    }

    // Get "current" tournament
    // If you truly only allow one at a time, this is fine.
    const [tRows] = await pool.query(
      "SELECT tid FROM tournaments ORDER BY startTime DESC LIMIT 1"
    );
    const tournament = tRows[0];
    if (!tournament) {
      return res.status(469).json({ error: "No active tournament" });
    }

    const tid = tournament.tid;
    const pid = user.pid;

    // Check if already joined
    const [existingRows] = await pool.query(
      "SELECT 1 FROM tournament_participants WHERE tid = ? AND pid = ? LIMIT 1",
      [tid, pid]
    );
    if (existingRows.length > 0) {
      return res.json({
        successful: true,
        joined: false,
        tid,
        message: "Already joined tournament",
      });
    }

    // Add user to tournament via stored procedure
    await pool.query("CALL join_tournament(?, ?)", [tid, pid]);

    return res.status(201).json({
      successful: true,
      joined: true,
      tid,
    });
  } catch (err) {
    console.error("[BACKEND] join-tournament error:", err);
    return res.status(500).json({ error: "Failed to join tournament" });
  }
});

// Check if tournament title exists in tournaments table
app.get("/api/tournament/title-exists/:title", async (req, res) => {
  // Get title
  const title = req.params.title;
  let existingTitle;
  // Check if title exists
  try {
    existingTitle = await pool.query(
      " SELECT title FROM TOURNAMENTS WHERE title = ? ",
      title
    );
  } catch (e) {
    console.log("Failed to check if tournamnet title exists ERROR: " + e);
  }

  if (existingTitle.length > 0) {
    res.json(true);
  } else {
    res.json(false);
  }
});

// Endpoint to add questions to tournament table in DB
app.post("/api/tournament/add-questions/:title", async (req, res) => {
  const title = req.params.title;
  const questions = req.body.questions; // JSON object/array from frontend

  if (!title || !questions) {
    return res
      .status(400)
      .json({ successful: false, error: "Missing title or questions" });
  }

  try {
    // If questionSet column is JSON or TEXT, we can just store the stringified JSON
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
// Gets questions from tournaments table
app.get("/api/tournament/questions/:title", async (req, res) => {
  const title = req.params.title;

  try {
      const [rows] = await pool.query(
          "SELECT questionSet FROM tournaments WHERE title = ? LIMIT 1",
          [title]
      );

      // No tournament found with that title
      if (!rows || rows.length === 0) {
          console.log(`No tournament found with title: ${title}`);
          return res.status(404).json({ error: "Tournament not found" });
      }

      const rawQuestionSet = rows[0].questionSet;

      // Tournament found but no questionSet
      if (!rawQuestionSet) {
          console.log(`Tournament ${title} has no questionSet`);
          return res.status(500).json({ error: "Tournament has no question set" });
      }

      // If stored as JSON text, parse it; if already an object/array, just use it
      let questions;
      if (typeof rawQuestionSet === "string") {
          try {
              questions = JSON.parse(rawQuestionSet);
          } catch (parseErr) {
              console.log("Failed to parse questionSet JSON:", parseErr);
              return res.status(500).json({ error: "Invalid question set JSON" });
          }
      } else {
          questions = rawQuestionSet;
      }

      return res.json({ questions });
  } catch (e) {
      console.log("Failed to get questions from tournaments table Error:", e);
      return res.status(500).json({ error: "Server error fetching questions" });
  }
});