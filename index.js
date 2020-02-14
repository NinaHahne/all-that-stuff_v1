const express = require("express");
const app = express();

// for socket.io:
const server = require("http").Server(app);
const io = require("socket.io")(server, { origins: "localhost:8080" });

app.use(express.static("./public"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/main.html");
});

// to make supertest possible:
// console.log(require.main == module);
// only if someona calls "node ."" or "node index.js", will not run, when just called within a test module:
if (require.main == module) {
  server.listen(process.env.PORT || 8080, () =>
    console.log("port 8080 listening! - AllThatStuff")
  );
}

io.on("connection", function(socket) {
  console.log(`socket with the id ${socket.id} is now connected`);

  socket.on("disconnect", function() {
    console.log(`socket with the id ${socket.id} is now disconnected`);
  });

  socket.on("game started", function(startPlayer) {
    console.log("game started. It's your turn, ", startPlayer);
  });

  // socket.emit("welcome", {
  //   message: "Welome. It is nice to see you"
  // });

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



});
