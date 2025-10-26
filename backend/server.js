// server.js (CommonJS)
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// imports the actual pool + init function from db.js
const { pool, initDb } = require('./db/db.js');
const auth = require('./db/authentication.js');


//Getting base and token vars from .env file
const BASE = process.env.CANVAS_BASE;
const TOKEN = process.env.CANVAS_TOKEN;

//Check to make sure token and base are set
if (!BASE) throw new Error("Missing BASE in .env");
if (!TOKEN) throw new Error("Missing TOKEN in .env");

//create the app instance to represent HTTP server and routes
const app = express();
app.use(express.json());
const PORT = process.env.PORT;

//app.use registers middleware that runs for every incoming requires
//Tells browser that our react app can make requests to our server running on different ports preventing CORS issues
app.use(cors({ origin: "http://localhost:3000" }));

// Registers get endpoint at /health to check if server is up
// (req, res) is route handler req: incoming obj, res outgoing response obj
// res.json sets content type to be application/json and sends a json body back
app.get("/health", (req, res) =>
    res.json({ ok: true, service: "canvas-proxy" }),
);

/**
 * Canvas GET proxy
 * Proxies any GET /api/v1/* to <BASE>/api/v1/* with Authorization: Bearer <TOKEN>
 */
app.get(/^\/api\/v1\/.*/, async (req, res) => {
  try {
    const upstreamUrl = `${BASE}${req.originalUrl}`; // '/api/v1/...' already present
    console.log('[CanvasProxy] GET ->', upstreamUrl);

    const upstream = await fetch(upstreamUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: 'application/json'
      }
      // (No body on GET)
    });

    const contentType = upstream.headers.get('content-type') || 'application/json';
    const bodyText = await upstream.text();

    // Optional: forward pagination headers (Canvas uses Link)
    const linkHeader = upstream.headers.get('link');
    if (linkHeader) res.set('Link', linkHeader);

    res.status(upstream.status).type(contentType).send(bodyText);
  } catch (e) {
    console.error('[CanvasProxy] error:', e);
    res.status(500).type('text/plain').send(String(e));
  }
});


// POST /api/register
// Registers new user to database
app.post('/api/register', async (req, res) => {
  console.log('Api Register');
  const { firstName, lastName, username, password } = req.body;

  if (!firstName || !lastName || !username || !password) {
    return res.status(400).json({ successful: false, error: 'Missing fields' });
  }

  try {
    // 1) Does user exist?
    const [lookup] = await pool.query('CALL get_user_by_username(?)', [username]);
    const rows = lookup?.[0] || [];
    if (rows.length > 0) {
      return res.status(409).json({ successful: false, error: 'Username taken' });
    }

    // 2) Hash password (your current auth uses bcrypt sync + returns hash)
    const hashedPassword = auth.encryptPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({ successful: false, error: 'Hashing failed' });
    }

    // 3) Insert user
    await pool.query('CALL register(?, ?, ?, ?)', [
      firstName,
      lastName,
      username,
      hashedPassword,
    ]);

    // 4) Token
    const token = auth.generateToken(username);
    return res.status(201).json({ successful: true, token });
  } catch (e) {
    console.error('[BACKEND] register error:', e);
    return res.status(500).json({ successful: false, error: 'DB error' });
  }
});


// POST /api/login
app.post('/api/login', async (req, res) => {
  console.log('Api Login');
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ successful: false, error: 'Missing fields' });
  }

  try {
    const [lookup] = await pool.query('CALL get_user_by_username(?)', [username]);
    const rows = lookup?.[0] || [];
    console.log('[LOGIN] lookup rows:', rows);
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
  const tokenHeaderKey = 'jwt-token'; // matches your frontend header
  const token = req.headers[tokenHeaderKey];

  try {
    if (!token) return res.status(401).json({ successful: false, error: 'No token' });
    const ok = auth.verifyToken(token);
    return res.json({ successful: !!ok });
  } catch {
    return res.status(401).json({ successful: false });
  }
});

//Start listening to start HTTP server
//.listen takes port and callback functioun that runs when sever starts
(async () => {
  try {
    await initDb(); // builds/verifies tables + procedures
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('[DB] init failed:', e);
    process.exit(1);
  }
})();