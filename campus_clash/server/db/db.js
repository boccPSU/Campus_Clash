let mysql = require('mysql')

export const connectToDatabase = async () => {
  let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password'
  });

  try {
    con.connect(function(err) {
      console.log('Connected!');
  });
  } catch (error) {
    console.error(error)
    throw Error('Failed to connect to Database')
  }
  return con;
}