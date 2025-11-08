// Backend server

// Imports
const OpenAI = require('openai');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb, addMockUsers } = require('./db/db.js');
const { getSortedMajors } = require('./db/sortData.js');
const auth = require('./db/authentication.js');

// Canvas proxy config
const BASE  = process.env.CANVAS_BASE;   // e.g. https://psu.instructure.com
const TOKEN = process.env.CANVAS_TOKEN;  // Canvas generatd token
const PORT  = Number(process.env.PORT || 3001);

if (!BASE)  throw new Error('Missing CANVAS_BASE in .env');
if (!TOKEN) throw new Error('Missing CANVAS_TOKEN in .env');

// Create server that expects JSON
const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000' })); //Bybass CORS

// Start Server
(async () => {
  try {
    await initDb();             // Initializies DB
    await addMockUsers(1000);   // Drops users table, comment out if you want to keep users

    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log(`Canvas proxy upstream: ${BASE}`);
    });
  } catch (e) {
    console.error('[DB] init failed:', e);
    process.exit(1);
  }
})();

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'canvas-proxy' });
});

// Grabs all enpoints with /api/v1 and directs them to proxy to use Canvas API 
app.get(/^\/api\/v1\/.*/, async (req, res) => {
  try {
    // Building Canvas request URL
    const upstreamUrl = `${BASE}${req.originalUrl}`;
    console.log('[CanvasProxy] GET ->', upstreamUrl);

    // Grabbing info from Canva API using GET, while verifying canvas token
    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json'
      }
    });

    const contentType = upstream.headers.get('content-type') || 'application/json'; // Get Content type, default to json if not proviced
    const linkHeader  = upstream.headers.get('link'); // Allows for pagenation
    if (linkHeader) res.set('Link', linkHeader);

    // Read response body as text and send back to client
    const bodyText = await upstream.text();
    res.status(upstream.status).type(contentType).send(bodyText);
  } catch (e) {
    console.error('[CanvasProxy] error:', e);
    res.status(500).type('text/plain').send(String(e));
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
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
    if (!firstName || !lastName || !username || !password || !university || !major) {
        return res.status(400).json({ successful: false, error: 'Missing fields' });
    }

    try {
        // Check if username is taken
        const [lookupSets] = await pool.query('CALL get_user_by_username(?)', [username]);
        const rows = lookupSets?.[0] || [];
        if (rows.length > 0) {
            return res.status(409).json({ successful: false, error: 'Username taken' });
        }

        // Hash password 
        const hashedPassword = auth.encryptPassword(password);
        if (!hashedPassword) {
            return res.status(500).json({ successful: false, error: 'Hashing failed' });
        }

        // Add user to users table and student row to students table via stored procedure
        await pool.query(
            'CALL register(?, ?, ?, ?, ?, ?, ?)',
            [
                firstName,
                lastName,
                username,
                hashedPassword,
                university,
                major,
                canvasToken ?? null, 
            ]
        );

        // Generate token for user
        const token = auth.generateToken(username);
        return res.status(201).json({ successful: true, token });
    } catch (e) {
        console.error('[BACKEND] register error:', e);
        return res.status(500).json({ successful: false, error: 'DB error' });
    }
});


// POST /api/login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ successful: false, error: 'Missing fields' });
  }

  try {
    const [lookupSets] = await pool.query('CALL get_user_by_username(?)', [username]);
    const rows = lookupSets?.[0] || [];
    if (rows.length === 0) {
      return res.status(401).json({ successful: false, error: 'Invalid username or password' });
    }

    const user = rows[0];
    const ok = auth.verifyPassword(password, user.password);
    if (!ok) {
      return res.status(401).json({ successful: false, error: 'Invalid username or password' });
    }

    const token = auth.generateToken(username);
    return res.json({ successful: true, token });
  } catch (e) {
    console.error('[BACKEND] login error:', e);
    return res.status(500).json({ successful: false, error: 'DB error' });
  }
});

// POST /api/auth
app.post('/api/auth', (req, res) => {
  const token = req.headers['jwt-token']; // matches your frontend convention
  try {
    if (!token) return res.status(401).json({ successful: false, error: 'No token' });
    const ok = auth.verifyToken(token);
    return res.json({ successful: !!ok });
  } catch {
    return res.status(401).json({ successful: false });
  }
});

// POST /api/event
app.post('/api/event', async (req, res) => {
  const {
    title,
    subtitle = null,
    description = null,
    location = null,
    xp = 0,
  } = req.body || {};

  if (!title) {
    return res.status(400).json({ successful: false, error: 'Missing title' });
  }

  try {
    // CALL create_event(p_title, p_subtitle, p_description, p_location, p_xp)
    const [resultSets] = await pool.query('CALL create_event(?, ?, ?, ?, ?)', [
      title, subtitle, description, location, xp
    ]);

    const eid = resultSets?.[0]?.eid;
    return res.status(201).json({ successful: true, eid });
  } catch (e) {
    console.error('[BACKEND] create event error:', e);
    return res.status(500).json({ successful: false });
  }
});

// GET /api/events
app.get('/api/events', async (_req, res) => {
  try {
    const [rows] = await pool.query('CALL list_events()');
    const items = rows?.[0] ?? [];
    res.json(items);
  } catch (e) {
    console.error('[BACKEND] list events error:', e);
    res.status(500).json({ successful: false });
  }
});

// GET /api/major-xp
app.get('/api/major-xp', async (_req, res) => {
  try {
    const rows = await getSortedMajors();
    res.json(rows);
  } catch (e) {
    console.error('[BACKEND] major-xp error:', e);
    res.status(500).json({ successful: false });
  }
});

// Generates tournement questions using opneai wrapper

const client = new OpenAI({apiKey: process.env.OPENAI_KEY});

// Create endopoint to send prompt to LLM
app.post("/api/generate-questions", async(req, res) => {
    //Expect a category, difficulty, and number of questions from req
    const {
        category = "Undefined",
        difficulty = "Undefined",
        count = 0,
    } = req.body;

    try{
        const completion = await client.chat.completions.create({
            // Specify LLM model
            model: "gpt-4.1-mini",

            // Format response into JSON we need
            response_format: {
                type: "json_schema",
                json_schema:{
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
                                        category: {type: "string"},
                                        difficulty: {
                                            type: "string",
                                            enum: ["easy", "medium", "hard"],
                                        },
                                        question: {type: "string"},
                                        options: {
                                            type: "array",
                                            items: {type: "string"},
                                            minItems: 4,
                                            maxItems: 4,
                                        },
                                        correctIndex: {
                                            type: "integer",
                                            minimum: 0,
                                            maximum: 3
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
                }
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
    }
    catch (err) {
    // Log any errors
    console.error(err);
    return res.status(500).json({ error: "Failed to generate questions" });
  }
});

// Creates a new tournament in the database if tournament title does not exist
// Should have tournament title, and no questions for now
app.post('/api/create-tournament', async (req, res) => {
    const { title } = req.body;
    // Check to see if title already exists in tournaments table
    const titleExists = await pool.query('SELECT * FROM tournaments WHERE questionSet = ?', [title]);
    if (titleExists[0].length > 0) {
        return res.status(400).json({ error: "Tournament already exists" });
    }

    // Call create_tournament stored procedure
    try {
        await pool.query('CALL create_tournament(?, NOW())', [
            title
        ]);
        
        console.log(`[DB] Tournament created: ${title}`);
        return res.status(201).json({ successful: true });  
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to create tournament" });
    } 
});