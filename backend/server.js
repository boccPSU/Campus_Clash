// Backend server

// Imports
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
  const { firstName, lastName, username, password, university, major, canvasToken } = req.body || {};
  if (!firstName || !lastName || !username || !password) {
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

    // Add user to users table
    await pool.query('CALL register(?, ?, ?, ?, ?, ?, ?)', [
      firstName, lastName, username, hashedPassword, university, major, canvasToken
    ]);

    // Generate token for user
    const token = auth.generateToken(username);
    return res.status(201).json({ successful: true, token });
  } catch (e) {
    console.error('[BACKEND] register error:', e);
    return res.status(500).json({ successful: false, error: '/register Error' });
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
    return res.status(201).json({ successful: true, token });
  } catch (e) {
    console.error('[BACKEND] login error:', e);
    return res.status(500).json({ successful: false, error: '/login Error' });
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
    return res.status(401).json({ successful: false , error: '/auth Error'});
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
    return res.status(500).json({ successful: false, error: "/event Error"});
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
    res.status(500).json({ successful: false, error: "/events Error" });
  }
});

// GET /api/major-xp
app.get('/api/major-xp', async (_req, res) => {
  try {
    const rows = await getSortedMajors();
    res.status(201).json({successful: true, rows});
  } catch (e) {
    console.error('[BACKEND] major-xp error:', e);
    res.status(500).json({ successful: false, error: "/major-xp Error" });
  }
});

//Listen For Calls
app.listen(PORT, () => {
  console.log(`Server listening on Port ${PORT}`);
})
