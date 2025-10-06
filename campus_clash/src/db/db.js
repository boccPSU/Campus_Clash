import { enablePromise, openDatabase } from "react-native-sqlite-storage"

// Enable promise for SQLite
enablePromise(true)

export const connectToDatabase = async () => {
  return openDatabase(
    { name: "campus_clash.db", location: "default" },
    () => {},
    error => {
      console.error(error)
      throw Error("Could not connect to database")
    }
  )
}

export const createTables = async db => {
  const usersQuery = `
     CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT,
        lastName TEXT,
     )
    `
  try {
    await db.executeSql(usersQuery)
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
  