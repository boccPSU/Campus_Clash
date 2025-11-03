// server.js (CommonJS)
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// imports the actual pool + init function from db.js
const { pool, initDb, addMockUsers } = require('./db/db.js');
const {getSortedMajors} = require('./db/sortData.js');

const auth = require('./db/authentication.js');


//Getting base and token vars from .env file for Canas API
const BASE = process.env.CANVAS_BASE;
const TOKEN = process.env.CANVAS_TOKEN;
let canvasToken = null;

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

// Start server
(async () => {
  try {
    console.log("TESTING");
    await initDb(); // builds/verifies tables + procedures
    await addMockUsers(1000);
    
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('[DB] init failed:', e);
    process.exit(1);
  }
})();

// Registers get endpoint at /health to check if server is up
// (req, res) is route handler req: incoming obj, res outgoing response obj
// res.json sets content type to be application/json and sends a json body back
app.get("/health", (req, res) =>
    res.json({ ok: true, service: "canvas-proxy" }),
);

//Main GET route that is hit whnever path starts with /api/
///^\/api\/.*/ is regex syntax to match any request that is /api/*
app.get(/^\/api\/.*/, async(req, res) =>{
    try{
        console.log("Api Caught");
        //main url we want to hit, .replace is removing /api/ from our url
        //upstream stands for orions server proxy talks to(canvas)
        //downstream is client behind the proxy (our browser / react app)
        const upstreamUrl  = BASE + req.originalUrl;
        //onsole.log("upstreamUrl:", upstreamUrl);

        //get response from canvas
        const upstream = await fetch(upstreamUrl, {
            method: "GET",
            headers:{
                Authorization: `Bearer ${TOKEN}`,
                Accept: "application/json",
            },
        });

        
        const bodyText = await upstream.text();
        //Get the type of content that is being sent back from canvas (json)
        const contentType = upstream.headers.get("content-type");

        //return status code, content type, and full response body as text
        res.status(upstream.status).type(contentType).send(bodyText);
    } catch (e){
        //return error string
        res.status(500).type("text/plain").send(String(e));
    }
})

app.use(bodyParser.json())
app.post('/api/register',(req, res)=>{
    console.log("Api Register");
    let {firstName, lastName, username, password} = req.body;
    pool.query(`call get_user_by_username(\'${username}\')`, function(err, results, fields) {
        if (err) {
            console.log(err);
            res.json({"successful":false});
        }
        console.log(results)
        if (results[0].length == 0) {
            console.log('new user');
            let hashedPassword = auth.encryptPassword(password);
            console.log(hashedPassword);
            if (!hashedPassword) {
                res.json({"successful":false});
            }
            let query = `CALL register(\'${firstName}\', \'${lastName}\', \'${username}\', \'${hashedPassword}\')`;
            pool.query(query, function(err, results, fields) {
                if (err) {
                    console.log(err);
                    res.json({"successful":false});
                }
                console.log(results);
            });
            const token = auth.generateToken(username);
            res.json({"successful":true, token});
        } else {
            console.log('old user');
            res.json({"successful":false});
        }
    });
})

app.post('/api/login',(req, res)=>{
    console.log("Api Login");
    const {username, password} = req.body;
    pool.query(`call get_user_by_username(\'${username}\')`, function(err, results, fields) {
        if (err) {
            console.log(err);
            res.json({"successful":false});
        }
        rows = results[0];
        console.log(rows)
        if (rows.length == 0) {
            console.log("Incorrect Username. Try Again");
            res.json({"successful":false})
        } else {
            console.log(rows[0]);
            if (auth.verifyPassword(password, rows[0].password)) {
                const token = auth.generateToken(username);
                console.log('Login Successful!');
                res.json({"successful":true, token});
            } else {
                console.log('Incorrect Password. Try Again');
                res.json({"successful": false});
            }
        }
    });
})

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

// POST /api/event
// Creates a new event 
app.post('/api/event', async (req, res) => {
  const {
    title,
    subtitle = null,
    description = null,
    location = null,
    xp = 0,
  } = req.body || {};

  try {
    // CALL create_event(p_title, p_subtitle, p_description, p_dueAt, p_location, p_xp, p_courseId)
    const [resultSets] = await pool.query('CALL create_event(?, ?, ?, ?, ?)', [
      title,
      subtitle,
      description,
      location,
      xp,
    ]);

    const eid = resultSets?.[0]?.eid;
    res.status(201).json({ successful: true, eid });
  } catch (e) {
    res.status(500).json({ successful: false });
  }
});

// GET /api/events — return all events
app.get('/api/events', async (req, res) => {
  try {
    const [rows] = await pool.query('CALL list_events()');
    const items = rows?.[0] ?? [];
    res.json(items);
  } catch (e) {
    res.status(500).json({ successful: false });
  }
});

// GET request to return sorted majors and XP by most to least XP amound
app.get('/api/major-xp', async (req, res) => {
	try {
    const rows = await getSortedMajors();
    res.json(rows);
  } catch (e) {
     res.status(500).json({ successful: false });
  }
})
