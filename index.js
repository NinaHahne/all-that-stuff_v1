const express = require("express");
const app = express();
const uuid = require("uuid");

// for socket.io:
const server = require("http").Server(app);
const io = require("socket.io")(server, { origins: "localhost:8080" });

app.use(express.static("./public"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/main.html");
});

app.use(express.static("./public"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/main.html");
});

server.listen(process.env.PORT || 8080, () =>
    console.log("port 8080 listening! - AllThatStuff")
);

// SOCKET.IO***********************************
let gameStarted = false;
let joinedPlayers = {};
let selectedPieces = [];
// let currentPlayer;

function nextPlayersTurn(activePlayer, activeObjects, queuedObjects) {
    // currentPlayer = activePlayer;
    let currentPlayerIndex = selectedPieces.indexOf(activePlayer);
    let nextPlayer;
    if (currentPlayerIndex + 1 <= selectedPieces.length - 1) {
        nextPlayer = selectedPieces[currentPlayerIndex + 1];
    } else if (currentPlayerIndex + 1 > selectedPieces.length - 1) {
        nextPlayer = selectedPieces[0];
    }
    io.sockets.emit("next turn", {
        activePlayer: activePlayer,
        nextPlayer: nextPlayer,
        activeObjects: activeObjects,
        queuedObjects: queuedObjects
    });
}

io.on("connection", function(socket) {
    console.log(`socket with the id ${socket.id} is now connected`);

    joinedPlayers[socket.id] = "";

    // Generate a v1 (time-based) id:
    // socket.userId = uuid.v1();

    // tell the player they connected, giving them their socket id and the list with players that joined so far:
    socket.emit("welcome", {
        socketId: socket.id,
        // userId: socket.userId,
        selectedPieces: selectedPieces
    });

    socket.on("selected piece", function(data) {
        console.log(`user socket ${data.socketId} joined the game as player '${data.selectedPieceId}'`);
        selectedPieces.push(data.selectedPieceId);
        joinedPlayers[socket.id] = data.selectedPieceId;

        io.sockets.emit("add selected piece", data.selectedPieceId);
        console.log('selectedPieces: ', selectedPieces);
    });

    socket.on("game started", function(data) {
        selectedPieces = data.joinedPlayerIds;
        console.log('joined players at game start: ', selectedPieces);
        let msg = `"${data.startPlayer}" started the game and starts with building!`;
        // console.log(msg);
        io.sockets.emit("game has been started", {
            message: msg,
            startPlayer: data.startPlayer,
            activeObjects: data.activeObjects,
            queuedObjects: data.queuedObjects
        });
    });

    socket.on("next player's turn", function(data) {
        nextPlayersTurn(data.activePlayer, data.activeObjects, data.queuedObjects);
    });

    // send a message to all connected sockets:
    // io.sockets.emit("achtung", {
    //     warning: "This site will go offline for maintenance in one hour."
    // });

    // send messages to specific sockets:
    // io.sockets.sockets[recipientSocketId].emit("request", {
    //   message: "You have a new friend request!"
    // });

    // send a message to every socket except a particular one:
    // io.sockets.sockets[recipientSocketId].broadcast.emit("brag", {
    //   message: "Hey everybody, I just received a new friend request!"
    // });
    // OR: to everyone except for the emmiting socket:
    // socket.broadcast.emit('hi everyone else')

    socket.on("disconnect", function() {
        console.log(`socket with the id ${socket.id} is now disconnected`);
        let piece = joinedPlayers[socket.id];
        console.log(`player piece "${piece}" is now free again`);
        selectedPieces = selectedPieces.filter(item => item !== piece);
        io.sockets.emit("remove selected piece", piece);
        delete joinedPlayers[socket.id];
    });
});
