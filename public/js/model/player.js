class Player {
    constructor(host, playedCell, roomId, username, socketId, symbol, turn, win) {
        this.host = host;
        this.playedCell = playedCell;
        this.roomId = roomId;
        this.username = username;
        this.socketId = socketId;
        this.symbol = symbol;
        this.turn = turn;
        this.win = win;
    }
}

module.exports = Player;