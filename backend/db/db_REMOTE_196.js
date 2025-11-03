let mysql = require("mysql");

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
