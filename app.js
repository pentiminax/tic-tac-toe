const { Socket } = require('socket.io');

const express = require('express');
const app = express();
const http = require('http').createServer(app);

const path = require('path');
const port = 8080;

/**
 * @type {Socket}
 */
const io = require('socket.io')(http);

app.use('/bootstrap/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/bootstrap/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'templates/index.html'));
});

const players = [];

io.on('connection', (socket) => {
    console.log(`[connection] ${socket.id}`);

    socket.on('userData', (player) => {
        console.log(`[userData] ${player.username}`);

        if (players.length === 2) {
            io.to(player.room).emit('maxNumberOfPlayersReached');
            return;
        }

        socket.join(player.room);

        players.push(player);

        if (players.length === 2) {
            io.to(player.room).emit('gameStart');
        }
    });

    socket.on('play', (player) => {
        console.log(`[play] ${player.username}`);
        io.to(player.room).emit('play', player);
    })

    socket.on('disconnect', () => {
        console.log(`[disconnect] ${socket.id}`);
    });
});

http.listen(port, () => {
    console.log('Listening on http://localhost:8080/');
});