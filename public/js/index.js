const player = {
    host: false,
    playedCell: "",
    roomId: null,
    username: "",
    socketId: "",
    symbol: "X",
    turn: false,
    win: false
};

const restartArea = $("#restart-area");
const waitingArea = $("#waiting-area");
const gameCard = $("#game-card");
const roomsCard = $("#rooms-card");
const turnMsg = $("#turn-message");

const socket = io();

let ennemyUsername = "";

socket.emit('get rooms');

socket.on('list rooms', (rooms) => {
    let html = "";

    if (rooms.length > 0) {
        rooms.forEach(room => {
            if (room.players.length !== 2) {
                html += `<li class="list-group-item d-flex justify-content-between">
                <p class="p-0 m-0 flex-grow-1 fw-bold">Salon de ${room.players[0].username} - ${room.id}</p>
                <button class="btn btn-sm btn-success join-room" data-room="${room.id}">Rejoindre</button>
            </li>`;
            }
        });

        if (html !== "") {
            roomsCard.removeClass('d-none');
            $("#rooms-list").append(html);
            $(".join-room").on("click", function () {
                if ($("#username").val() !== "") {
                    const roomId = $(this).data('room');

                    player.username = $("#username").val();
                    player.socketId = socket.id;
                    player.roomId = roomId;

                    socket.emit('userData', player);
                    $("#user-card").hide();
                    $("#waiting-area").removeClass('d-none');
                    roomsCard.addClass('d-none');
                }
            });
        }
    }
});

socket.on('start game', (players) => {
    startGame(players);
});

socket.on('gameRestart', (players) => {
    restartGame(players);
});

socket.on('play', (ennemyPlayer) => {

    if (ennemyPlayer.username !== player.username && !ennemyPlayer.turn) {

        $(`#${ennemyPlayer.playedCell}`).addClass('text-danger').html("O");

        if (ennemyPlayer.win) {
            updateTurnMessage('alert-info', 'alert-danger', `C'est perdu ! <b>${ennemyPlayer.username}</b> a gagné !`);
            console.log(ennemyPlayer);
            calculateWinner(ennemyPlayer.playedCell, 'O');

            if (player.host) {
                restartArea.removeClass('d-none');
            }

            return;
        }

        if (gameFinished()) {
            $("#turn-message").removeClass('alert-info').addClass('alert-warning').html(`C'est une egalité !`);
            return;
        }

        $("#turn-message").removeClass('alert-info').addClass('alert-success').html(`C'est ton tour de jouer`);
        player.turn = true;
    } else {
        if (player.win) {
            $("#turn-message").addClass('alert-success').html("Félicitations, tu as gagné la partie !");

            if (player.host) {
                restartArea.removeClass('d-none');
            }

            return;
        }

        if (gameFinished()) {
            $("#turn-message").removeClass('alert-info').addClass('alert-warning').html(`C'est une egalité !`);

            if (player.host) {
                restartArea.removeClass('d-none');
            }

            return;
        }

        $("#turn-message").removeClass('alert-success').addClass('alert-info').html(`C'est au tour de <b>${ennemyUsername}</b> de jouer`);
        player.turn = false;
    }
});

socket.on('join room', (roomId) => {
    player.roomId = roomId;
    $("#link-to-share").html(`<a href="${window.location.href}?room=${player.roomId}" target="_blank">${window.location.href}?room=${player.roomId}</a>`);
});

$("#form").on("submit", function (e) {
    e.preventDefault();

    player.username = $("#username").val();

    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');

    if (roomId) {
        player.roomId = roomId;
    } else {
        player.host = true;
        player.turn = true;
    }

    player.socketId = socket.id;

    socket.emit('userData', player);

    socket.on('maxNumberOfPlayersReached', function () {
        $("#error-message").removeClass('d-none');
    });

    $("#user-card").hide();
    $("#waiting-area").removeClass('d-none');
    $("#rooms-card").addClass('d-none');
});

$(".cell").on("click", function (e) {
    const playedCell = $(this).attr('id');

    if ($(this).html() === "" && player.turn) {
        player.playedCell = playedCell;

        $(this).text(`${player.symbol}`);

        player.win = calculateWinner(playedCell);
        player.turn = false;

        socket.emit('play', player);
    }
});

$("#restart").on("click", function (e) {
    restartGame();
});

function startGame(players) {
    restartArea.addClass('d-none');
    waitingArea.addClass('d-none');
    gameCard.removeClass('d-none');
    turnMsg.removeClass('d-none');

    const ennemyPlayer = players.find(p => p.username != player.username);
    ennemyUsername = ennemyPlayer.username;

    if (player.host && player.turn) {
        updateTurnMessage('alert-info', 'alert-success', "C'est ton tour de jouer");
    } else {
        updateTurnMessage('alert-success', 'alert-info', `C'est au tour de <b>${ennemyPlayer.username}</b> de jouer`);
    }
}

function restartGame(players = null) {
    $(".cell").html("");
    $(".cell").removeClass("win-cell");
    $(".cell").removeClass("text-danger");
    $("#turn-message").removeClass('alert-warning');
    $("#turn-message").removeClass('alert-danger');

    if (player.host && !players) {
        player.turn = true;
        socket.emit('gameRestart', player.roomId);
    }

    if (!player.host) {
        player.turn = false;
    }

    player.win = false;

    if (players) {
        startGame(players);
    }
}

function updateTurnMessage(classToRemove, classToAdd, html) {
    turnMsg.removeClass(classToRemove).addClass(classToAdd).html(html);
}

function calculateWinner(playedCell, symbol = player.symbol) {
    let row = playedCell[5];
    let column = playedCell[7];


    // 1) VERTICAL (check if all the symbols in clicked cell's column are the same)
    let win = true;

    for (let i = 1; i < 4; i++) {
        if ($(`#cell-${i}-${column}`).text() !== symbol) {
            win = false;
        }
    }

    if (win) {
        for (let i = 1; i < 4; i++) {
            $(`#cell-${i}-${column}`).addClass("win-cell");
        }

        return win;
    }

    // 2) HORIZONTAL (check the clicked cell's row)

    win = true;
    for (let i = 1; i < 4; i++) {
        if ($(`#cell-${row}-${i}`).text() !== symbol) {
            win = false;
        }
    }

    if (win) {
        for (let i = 1; i < 4; i++) {
            $(`#cell-${row}-${i}`).addClass("win-cell");
        }

        return win;
    }

    // 3) MAIN DIAGONAL (for the sake of simplicity it checks even if the clicked cell is not in the main diagonal)

    win = true;

    for (let i = 1; i < 4; i++) {
        if ($(`#cell-${i}-${i}`).text() !== symbol) {
            win = false;
        }
    }

    if (win) {
        for (let i = 1; i < 4; i++) {
            $(`#cell-${i}-${i}`).addClass("win-cell");
        }

        return win;
    }

    // 3) SECONDARY DIAGONAL

    win = false;
    if ($("#cell-1-3").text() === symbol) {
        if ($("#cell-2-2").text() === symbol) {
            if ($("#cell-3-1").text() === symbol) {
                win = true;

                $("#cell-1-3").addClass("win-cell");
                $("#cell-2-2").addClass("win-cell");
                $("#cell-3-1").addClass("win-cell");

                return win;
            }
        }
    }
}

function gameFinished() {
    let gameFinished = true;

    $(".cell").each(function (index, element) {
        if ($(element).text() === "") {
            gameFinished = false;
        }
    });

    return gameFinished;
}