const users = []

const addUser = ( { id, username, room }) => {
    // clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate the data
    if (!username || !room) {
        return {
            error:'Username and room are required!'
        }
    }

    //Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser) {
        return {
            error:'Username already exists for this room!'
        }
    }

    // Store user
    const user = { id, username, room}
    users.push(user) //adds the user object to the users array
    return { user }

}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id ) // short hand syntax

    // -1 if no match
    if (index !== -1) {
        // we could have use filter method like in the notes app, but splice stops one it found a match, so more efficient here.
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}