const { Socket } = require('socket.io');

const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

const path = require('path');
const port = 8080;

/**
 * @type {Socket}
 */
const io = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

app.use('/bootstrap/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/bootstrap/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static('public'));

app.get('/', cors(), (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/index.html'));
});

app.get('/games/tic-tac-toe', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/games/tic-tac-toe.html'));
});


let rooms = [];

io.on('connection', (socket) => {
    console.log(`[connection] ${socket.id}`);

    socket.on('userData', (player) => {
        console.log(`[userData] ${player.username}`);

        let room = null;

        if (!player.roomId) {
            room = createRoom(player);
            io.emit('create room', room);
            console.log(`[create room ] - ${room.id} - ${player.username}`);
        } else {
            room = rooms.find(r => r.id === player.roomId);

            if (room === undefined) {
                return;
            }

            if (room) {
                player.roomId = room.id;
                room.players.push(player);
            }
        }

        /*if (room.players.length === 2) {
            io.to(socket.id).emit('maxNumberOfPlayersReached');
            return;
        } */

        socket.join(room.id);

        io.to(socket.id).emit('join room', room.id);
        console.log('join room ==> ' + room.id);

        if (room.players.length === 2) {
            io.to(room.id).emit('start game', room.players);
        }
    });

    socket.on('get rooms', () => {
        console.log(`[get rooms] ${socket.id}`);
        io.to(socket.id).emit('list rooms', rooms);
    });

    socket.on('play', (player) => {
        console.log(`[play] ${player.username}`);
        io.to(player.roomId).emit('play', player);
    });

    socket.on('gameRestart', (roomId) => {
        const room = rooms.find(r => r.id === roomId);

        if (room && room.players.length === 2) {
            io.to(room.id).emit('gameRestart', room.players);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[disconnect] ${socket.id}`);

        let room = null;

        rooms.forEach(r => {
            r.players.forEach(p => {
                if (p.socketId === socket.id && p.host) {
                    room = r;
                    rooms = rooms.filter(r => r !== room);
                    io.emit('remove room', room);
                }
            });
        });
    });
});

http.listen(port, () => {
    console.log('Listening on http://localhost:8080/');
});

function createRoom(player) {
    const room = { id: roomId(), players: [] };

    player.roomId = room.id;

    room.players.push(player);
    rooms.push(room);

    return room;
}

function roomId() {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 1; i < 9; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}