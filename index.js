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
io.on("connection", function(socket) {
    console.log(`socket with the id ${socket.id} is now connected`);

    // Generate a v1 (time-based) id:
    socket.userid = uuid.v1();
    //tell the player they connected, giving them their id:
    socket.emit("welcome", {
        id: socket.userid
    });

    socket.on("game started", function(startPlayer) {
        let msg = `to everyone: game started. It's ${startPlayer}'s turn!`;
        console.log(msg);
        io.sockets.emit("game started", msg);
    });

    // send a message to all connected sockets:
    io.sockets.emit("achtung", {
        warning: "This site will go offline for maintenance in one hour."
    });
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
    });
});
