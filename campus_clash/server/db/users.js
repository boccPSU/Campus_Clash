export const addUser = async (con, user) => {
    const values = [user.firstName, user.lastName]
    try {
        return con.query('EXEC add_user fName = ?, lName = ?', values);
    } catch (error) {
        console.error(error)
        throw Error("Failed to add User")
    }
}

export const getUser = async (con, name) => {
    try {
        const users = []
        const results = await con.query('EXEC get_users_by_name Name = ?', name)
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