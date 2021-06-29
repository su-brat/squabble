const express = require('express')
const app = express()
const socketio = require('socket.io')
const http = require('http')
const server = http.createServer(app)
const io = socketio(server)
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash')

const users = {}  // { room: { username: socket.id } }

app.set('view engine', 'ejs')

app.set('views', path.join(__dirname, 'views'))

//to get POST data
app.use(express.urlencoded({ extended: true }))

//to parse and fetch json data
app.use(express.json())

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}))

app.use(flash())

app.use(express.static(path.join(__dirname, 'public')))

app.use((req, res, next) => {
    res.locals.success = req.flash('success')
    res.locals.error = req.flash('error')
    next()
})

app.get('/', (req, res) => {
    const { username, room } = req.query
    if (username==null || username=='')
        return res.redirect('/login')
    res.locals.users = Object.keys(users[room] || {})
    res.render('index', { username, room })
})

app.get('/login', (req, res) => res.render('login'))

app.post('/join', (req, res) => {
    const { username, room } = req.body
    if (users[room] && users[room][username]) {
        req.flash('error', 'Username already in use.')
        return res.redirect('/login')
    }
    req.flash('success', 'Success! Welcome to sQuaBBle.')
    res.redirect(`/?username=${username}&room=${room}`)
})

io.on('connection', socket => {
    console.log('A user connected..')
    socket.on('join-room', ({ username, room }) => {
        if (!username) return socket.disconnect()
        if (users[room] && users[room][username]) {
            delete users[room][username]
            return socket.disconnect()
        }
        socket.username = username
        socket.room = room
        if (!users[room]) users[room] = {}
        users[room][username] = socket.id
        socket.join(room)    
        socket.emit('message', 'Welcome to '+room+'!')
        socket.to(room).emit('message', username+' joined this room.')
        socket.on('message', data => {
            socket.to(room).emit('message', data+':::'+username)
            socket.emit('message', data+':::'+'Me')
        })
    })
    socket.on('disconnect', () => {
        if (socket.username && socket.room) {
            delete users[socket.room][socket.username]
            if (Object.keys(users[socket.room]).length==0)
                delete users[socket.room]
            socket.to(socket.room).emit('message', socket.username+' left the room..')
        }
        console.log('A user disconnected..')
    })
})

server.listen(3001, () => {
    console.log('Listening to port 3001')
})
