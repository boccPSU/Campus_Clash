import * as state from statements.js

let mysql = require('mysql')

export const connectToDatabase = async () => {
  let con = mysql.createConnection({
    host: 'localhost',
    user: 'username',
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

export const createTables = async db => {
  try {
    await db.executeSql(statements.create)
  } catch (error) {
    console.error(error)
    throw Error(`Failed to create tables`)
  }
}

  export const getTableNames = async db => {
    try {
      const tableNames = []
      const results = await db.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      )
      results?.forEach(result => {
        for (let index = 0; index < result.rows.length; index++) {
          tableNames.push(result.rows.item(index).name)
        }
      })
      return tableNames
    } catch (error) {
      console.error(error)
      throw Error("Failed to get table names from database")
    }
  }
  
  export const removeTable = async (db, tableName) => {
    const query = `DROP TABLE IF EXISTS ${tableName}`
    try {
      await db.executeSql(query)
    } catch (error) {
      console.error(error)
      throw Error(`Failed to drop table ${tableName}`)
    }
  }
  