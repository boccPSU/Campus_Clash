let mysql = require('mysql')

//Create a connection to the SQL Database

const dbPool = mysql.createPool({
      host: 'localhost',
      user: 'clash_admin',
      password: 'password',
      database: 'campus_clash'
});
dbPool.query('SELECT * FROM users', (err, rows) => {
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