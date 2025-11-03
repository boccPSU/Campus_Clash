let mysql = require("mysql");

const host = process.env.MYSQL_HOST;
const username = process.env.MYSQL_USERNAME;
const password = process.env.MYSQL_PASSWORD;
const database = process.env.MYSQL_DB;

let dropQueries = [
    `DROP TABLE IF EXISTS users`,
    `DROP PROCEDURE IF EXISTS get_user_by_first_name`,
    `DROP PROCEDURE IF EXISTS get_user_by_username`,
    `DROP PROCEDURE IF EXISTS login`,
    `DROP PROCEDURE IF EXISTS register`
]

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
    `DELIMITER $$
        CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE \`get_user_by_first_name\`(IN firstName varchar(32))
        BEGIN
            SELECT * FROM users WHERE firstName = firstName;
        END$$
        DELIMITER;`,
    `DELIMITER $$
        CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE \`get_user_by_username\`(IN username varchar(32))
        BEGIN
            SELECT * FROM users WHERE username = username;
        END$$
        DELIMITER ;`,
    `DELIMITER $$
        CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE \`login\`(IN username varchar(32), password char(60))
        BEGIN
            SELECT * FROM users WHERE username = username AND password = password;
        END$$
        DELIMITER ;`,
    `DELIMITER $$
        CREATE DEFINER=\`root\`@\`localhost\` PROCEDURE \`register\`(IN firstName varchar(32), lastName varchar(32), username varchar(32), password char(60))
        BEGIN
            INSERT INTO users (firstName, lastName, username, password) VALUES (firstName, lastName, username, password);
        END$$
        DELIMITER ;`,
]

//Create a connection to the SQL Database

const dbPool = mysql.createPool({
    host: host,
    user: username,
    password: password,
    database: database,
});
dbPool.query("SELECT * FROM users", (err, rows) => {
    if(err) {
        dropQueries.forEach((query, index) => {
            dbPool.query(query);
        });
        createQueries.forEach((query, index) => {
            dbPool.query(query);
        })
        console.log("Remade Database");
    }
    console.log(rows);
});
module.exports = dbPool;

// exports.execQuery=function(query, callback) {
//   dbPool.getConnection(function(err, connection){
//     if (err) {
//       connection.release();
//       throw err;
//     }
//     connection.query(query, function(err, rows){
//       connection.release();
//       if(!err) {
//         callback(null, {rows: rows});
//       }
//     });
//     connection.on('error', function(err) {
//       throw err;
//       return
//     })
//   })
// }
