const express = require("express");
const app = express();
// const uuid = require("uuid");

// for socket.io:
const server = require("http").Server(app);
const io = require("socket.io")(server, {
    origins: "localhost:8080 http://192.168.0.14:8080:*"
});

// cards:
// const cards = require("./cards_enUS");

// import game file:
const game = require('./game');

app.use(express.static("./public"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/main.html");
});

server.listen(process.env.PORT || 8080, () =>
    console.log("port 8080 listening! - AllThatStuff")
);

// SOCKET.IO***********************************

// start the game when a socket connects:
io.on("connection", function(socket) {
    console.log(`socket with the id ${socket.id} is now connected`);
    game.initGame(io, socket);

    socket.on('connected', function(data) {
        console.log(`socket with the id ${data.socketId} is now connected`);
    });

    socket.on("disconnect", function() {
        console.log(`socket with the id ${socket.id} is now disconnected`);
        // let piece = joinedPlayers[socket.id];
        // console.log(`player piece "${piece}" is now free again`);
        // selectedPieces = selectedPieces.filter(item => item !== piece);
        // if (piece) {
        //     io.sockets.emit("remove selected piece", piece);
        //     delete joinedPlayers[socket.id];
        // }
    });
});
