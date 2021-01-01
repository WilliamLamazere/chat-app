const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const { addUser, getUser, removeUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))
 
// `on` allows the server to listen for an event and respond to it.
//socket.emit would emit to a single connection/client that actually triggered the event
//io.emit to all of them
io.on('connection', (socket) => {
    console.log('New WebSocket connection')
    
    socket.on('join', ({username, room}, callback) => {

        const { error, user } = addUser( { id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        //.join method works only on server side
        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        //socket.broacast allows to send to all clients, excepted the current client
        //.to method allows to be room specific
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', ` ${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })
    
    // callback is used to acknowledge the sendMessage event
    socket.on('sendMessage', (message, callback) => {

        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback('Profanity is not permitted!')
        }
        
        const user = getUser(socket.id)

        // first arg is always an event, and then variable to emit/receive
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })

    socket.on('sendLocation', (locationCoords, callback) => {
        const user = getUser(socket.id)

        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${locationCoords.lat},${locationCoords.long}`))
        callback()
    })

    // runs when a client gets disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })
})

//We here pass the listen method to server (instead of app), compared to a simple express server.
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})