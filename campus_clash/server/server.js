//Express backend to serve as a proxy to Canvas, need this to avoid CORS in the browser
//Need to cd to server directory and npm init -y to init server
//Need to install express, dotenv, and cors using npm i express dotenv cors
//.env file should have CANVAS_BASE=https://psu.instructure.com CANVAS_TOKEN PORT =3001 BACKEND_BASE=http://localhost:3001
//Change token to git IGNORE!!!!!!!!
require("dotenv").config(); //Loads dotenv library allowing vars in .env to be available by using process.env.VAR_NAME

const express = require("express"); //Importing express framework for defining routes and starting HTTP server
const cors = require("cors"); //Importing cors middleware to allow frontend http:/localhost:3000 to call backend http://localhost:3001
const mysql = require("mysql");
const bodyParser = require("body-parser");
const pool = require("./db/db.js");

//Getting base and token vars from .env file
const BASE = process.env.CANVAS_BASE;
const TOKEN = process.env.CANVAS_TOKEN;

//Check to make sure token and base are set
if (!BASE) throw new Error("Missing BASE in .env");
if (!TOKEN) throw new Error("Missing TOKEN in .env");

//create the app instance to represent HTTP server and routes
const app = express();

//app.use registers middleware that runs for every incoming requires
//Tells browser that our react app can make requests to our server running on different ports preventing CORS issues
//CHECK PORT HERE
app.use(cors({ origin: "http://localhost:5000" }));

// Registers get endpoint at /health to check if server is up
// (req, res) is route handler req: incoming obj, res outgoing response obj
// res.json sets content type to be application/json and sends a json body back
app.get("/health", (req, res) =>
    res.json({ ok: true, service: "canvas-proxy" }),
);

//Main GET route that is hit whnever path starts with /api/
///^\/api\/.*/ is regex syntax to match any request that is /api/*
// app.get(/^\/api\/.*/, async(req, res) =>{
//     try{
//         //main url we want to hit, .replace is removing /api/ from our url
//         //upstream stands for orions server proxy talks to(canvas)
//         //downstream is client behind the proxy (our browser / react app)
//         const upstreamUrl  = BASE + req.originalUrl;
//         //onsole.log("upstreamUrl:", upstreamUrl);

//         //get response from canvas
//         const upstream = await fetch(upstreamUrl, {
//             method: "GET",
//             headers:{
//                 Authorization: `Bearer ${TOKEN}`,
//                 Accept: "application/json",
//             },
//         });

//         const bodyText = await upstream.text();
//         //Get the type of content that is being sent back from canvas (json)
//         const contentType = upstream.headers.get("content-type");

//         //return status code, content type, and full response body as text
//         res.status(upstream.status).type(contentType).send(bodyText);
//     } catch (e){
//         //return error string
//         res.status(500).type("text/plain").send(String(e));
//     }
// })

app.get("/api", (req, res) => {
    res.send("From Server");
});
app.use(bodyParser.json());
app.post("/api/register", (req, res) => {
    let { firstName, lastName, username, password } = req.body;
    let query = `CALL add_user(${firstName}, ${lastName}, ${username}, ${password})`;
    console.log(query);
    pool.query(query);
    console.log(req.body);
    res.json({ message: "Form Submitted" });
});

//Start listening to start HTTP server
//.listen takes port and callback functioun that runs when sever starts
const PORT = process.env.PORT;
app.listen(PORT, () => {
    //log when proxy is running
    console.log(`Canvas proxy listening on http://localhost:${PORT}`);
    console.log(`Proxy upstream: ${BASE}`);
});
