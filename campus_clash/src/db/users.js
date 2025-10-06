export const addUser = async (db, user) => {
    const insertQuery = `
      INSERT INTO Users (firstName, lastName) 
        VALUES (?, ?)
    `

    const values = [user.firstName, user.lastName]
    try {
        return db.executeSql(insertQuery, values)
    } catch (error) {
        console.error(error)
        throw Error("Failed to add User")
    }
}

export const getUser = async (db) => {
    try {
        const users = []
        const results = await db.executeSql("SELECT * FROM Users")
        results?.forEach((result) => {
            for (let index = 0; index < result.rows.length; index++) {
                users.push(results.row.item(index))
            }
        })
        return users
    } catch (error) {
        console.error(error)
        throw Error("Failed to get Users from database")
    }
}