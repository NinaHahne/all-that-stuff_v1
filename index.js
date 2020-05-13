const express = require("express");
const app = express();
// const uuid = require("uuid");

// for socket.io:
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  origins:
    "localhost:8080 http://192.168.0.15:8080:* http://192.168.2.112:8080:* allthatstuff.herokuapp.com:*"
});

// cards:
const cardsEN = require("./cards_enUS.json");
const cardsDE = require("./cards_de.json");
let cards = cardsEN;
let chosenLanguage = "english";

app.use(express.static("./public"));

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/public/main.html");
});

server.listen(process.env.PORT || 8080, () =>
  console.log("port 8080 listening! - AllThatStuff")
);

// §§ GAME STATE: ********************************

let gameStarted = false;
let joinedPlayers = {}; // { socketId: selectedPieceId, ... }
let selectedPieces = []; // [ pieceId, .... ]
let gameMaster;
let currentPlayer;
// number of rounds, depending on number of players:
let numberOfTurnsForThisGame;
let numberOfTurnsLeft;

// card deck: ----------------------
let stuffCards = [];
let discardPile = [];
let firstCard;
let newPile = false;

// guessing & points: --------------
let correctAnswer;
let guessedAnswers = {}; // { pieceId: <guessed item number> }
let answeringOrder = []; // [ pieceId, ... ]
let playerPointsTotal = {}; // { pieceId: <points> }
let playerNames = {};
let doneBtnPressed = false;
let cardPointsHTML;
let guessingOrDiscussionTime = false;

// active and queued objects:
let activeObjects;
let queuedObjects;
let dataForNextTurn = {};

// TODO: IN THE FUTURE: replace above selectedPieces, guessedAnswers & playerPointsTotal with playersObj:
let playersObj = {};

// playersObj[data.selectedPieceId].name = data.playerName;

// https://hackernoon.com/accessing-nested-objects-in-javascript-f02f1bd6387f
// (playersObj[data.selectedPieceId] || {}).name = data.playerName;
// console.log('playersObj', playersObj);

// players will later be an object like this:
// let playersObj = {
//     "pieceId": {
//         name: "Bob",
//         totalPoints: 8,
//         guessedAnswer: 2
//     }
// };
// OR.. use a "game state" object for all information:
const gameState = {
  players: {}
};
// will later look like this:
// const gameState = {
//     players: {
//         "socket.id": {
//             pieceId: "green",
//             name: "Bob",
//             totalPonts: 8,
//             guessedAnswer: 2
//         }
//     }
// };

// §§ FUNCTIONS ********************************

function rainbowSort(a, b) {
  let rainbow = ['grey', 'purple', 'blue', 'green', 'yellow', 'orange', 'red', 'pink'];
  return rainbow.indexOf(a) - rainbow.indexOf(b);
}

//modern version of the Fisher–Yates shuffle algorithm:
function shuffleCards(cards) {
  //shuffles array in place
  let j, x, i;
  for (i = cards.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    x = cards[i];
    cards[i] = cards[j];
    cards[j] = x;
  }
  stuffCards = discardPile;
  discardPile = [];
  return cards;
}

function discardCard() {
  if (newPile === false) {
    discardPile.push(firstCard);
  }
}

function replaceCard() {
  discardCard();
  if (stuffCards.length > 0) {
    newPile = false;
    // drawCard(stuffCards);
    firstCard = stuffCards.shift();
  } else {
    shuffleCards(discardPile);
    newPile = true;
  }
}

function nextPlayersTurn(data) {
  let currentPlayerIndex = selectedPieces.indexOf(data.activePlayer);

  let nextPlayer;
  if (selectedPieces[currentPlayerIndex + 1]) {
    nextPlayer = selectedPieces[currentPlayerIndex + 1];
  } else {
    nextPlayer = selectedPieces[0];
  }

  currentPlayer = nextPlayer;

  replaceCard();
  correctAnswer = randomNumber(1, 7);
  guessedAnswers = {};
  answeringOrder = [];

  activeObjects = data.activeObjects;
  queuedObjects = data.queuedObjects;

  doneBtnPressed = false;
  guessingOrDiscussionTime = false;

  io.sockets.emit("next turn", {
    activePlayer: data.activePlayer,
    nextPlayer: nextPlayer,
    activeObjects: data.activeObjects,
    queuedObjects: data.queuedObjects,
    newCard: firstCard,
    correctAnswer: correctAnswer,
    numberOfTurnsLeft: numberOfTurnsLeft
  });
}

// Function to generate random number, min incl, max excl.
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function collectGuesses(data) {
  guessedAnswers[data.guessingPlayer] = data.guessedItem;
  answeringOrder.push(data.guessingPlayer);

  let guessedAnswersLength = Object.keys(guessedAnswers).length;
  let joinedPlayersLength = selectedPieces.length;

  io.sockets.emit("someone guessed", {
    guessingPlayer: data.guessingPlayer,
    guessedItem: data.guessedItem
  });

  // when everyone guessed: add points:
  if (guessedAnswersLength == joinedPlayersLength - 1) {
    let playerPointsIfCorrect = {};
    let actualPlayerPoints = {};
    let numberOfCorrectGuesses = 0;

    if (joinedPlayersLength <= 6) {
      // points for up to 6 players (5 guessers):
      let pointsCounter = answeringOrder.length;
      for (let i = 0; i < answeringOrder.length; i++) {
        playerPointsIfCorrect[answeringOrder[i]] = pointsCounter;
        if (guessedAnswers[answeringOrder[i]] == correctAnswer) {
          actualPlayerPoints[answeringOrder[i]] = pointsCounter;
          playerPointsTotal[answeringOrder[i]] += pointsCounter;
          numberOfCorrectGuesses++;
        } else {
          actualPlayerPoints[answeringOrder[i]] = 0;
        }
        pointsCounter--;
      }
    } else if (joinedPlayersLength > 6) {
      // for more than 6 players (max 8): (6-7 guessers):
      // maximum points: 5
      let pointsCounter = 0;
      for (let i = answeringOrder.length; i > 0; i--) {
        playerPointsIfCorrect[answeringOrder[i]] = pointsCounter;
        if (guessedAnswers[answeringOrder[i]] == correctAnswer) {
          actualPlayerPoints[answeringOrder[i]] = pointsCounter;
          playerPointsTotal[answeringOrder[i]] += pointsCounter;
          numberOfCorrectGuesses++;
        } else {
          actualPlayerPoints[answeringOrder[i]] = 0;
        }
        if (pointsCounter < 5) {
          pointsCounter++;
        }
      }
    }
    // building player gets 1 point for each correct guess:
    playerPointsTotal[currentPlayer] += numberOfCorrectGuesses;

    dataForNextTurn = {
      activePlayer: currentPlayer,
      correctAnswer: correctAnswer,
      guessedAnswers: guessedAnswers,
      playerPointsIfCorrect: playerPointsIfCorrect,
      actualPlayerPoints: actualPlayerPoints,
      playerPointsTotal: playerPointsTotal
    };

    io.sockets.emit("everyone guessed", dataForNextTurn);
  }
}

function getWinner() {
  let ranking = [];
  for (let player in playerPointsTotal) {
    let name = playerNames[player];
    let playerPointsObj = {
      player: player,
      name: name,
      points: playerPointsTotal[player]
    };
    ranking.push(playerPointsObj);
  }

  // sort array in place by points, descending:
  ranking.sort(function(a, b) {
    return b.points - a.points;
  });

  let winner = ranking[0].player;
  console.log(winner, "wins!");

  // reset selectedPieces for next game:
  selectedPieces = [];
  gameStarted = false;

  io.sockets.emit("game ends", {
    rankingArray: ranking,
    winner: winner
  });
}

function addPlayerMidGame(data) {
  console.log(
    `${data.playerName} rejoined the game with the color ${data.selectedPieceId}`
  );
  io.sockets.emit("add player midgame", {
    selectedPieceId: data.selectedPieceId,
    playerName: data.playerName,
    gameMaster: gameMaster,
    activePlayer: currentPlayer,
    playerPointsTotal: playerPointsTotal,
    numberOfTurnsForThisGame: numberOfTurnsForThisGame,
    numberOfTurnsLeft: numberOfTurnsLeft,
    firstCard: firstCard,
    correctAnswer: correctAnswer,
    guessedAnswers: guessedAnswers,
    activeObjects: activeObjects,
    queuedObjects: queuedObjects,
    doneBtnPressed: doneBtnPressed,
    cardPointsHTML: cardPointsHTML,
    guessingOrDiscussionTime: guessingOrDiscussionTime,
    dataForNextTurn: dataForNextTurn
  });
}

// §§ SOCKET.IO ********************************
io.on("connection", socket => {
  console.log(`socket with the id ${socket.id} is now connected`);

  // Generate a v1 (time-based) id:
  // socket.userId = uuid.v1();

  // tell the player they connected, giving them their socket id and the list with players that joined so far:
  socket.emit("welcome", {
    // userId: socket.userId,
    socketId: socket.id,
    selectedPieces: selectedPieces,
    playerNames: playerNames,
    chosenLanguage: chosenLanguage,
    gameStarted: gameStarted,
    gameMaster: gameMaster
  });

  socket.on("selected piece", data => {
    if (data.selectedPieceId) {
      console.log(
        `${data.playerName} joined the game with the color ${data.selectedPieceId}`
      );
      selectedPieces.push(data.selectedPieceId);
      joinedPlayers[socket.id] = data.selectedPieceId;
      playerNames[data.selectedPieceId] = data.playerName;

      // first player that selects a piece becomes "game master":
      if (selectedPieces.length == 1) {
        gameMaster = data.selectedPieceId;
      }

      io.sockets.emit("add selected piece", {
        socketId: data.socketId,
        selectedPieceId: data.selectedPieceId,
        playerName: data.playerName,
        gameMaster: gameMaster
      });
    }
  });

  socket.on("change language", data => {
    if (data.newLanguage == "german") {
      cards = cardsDE;
      chosenLanguage = "german";
    } else if (data.newLanguage == "english") {
      cards = cardsEN;
      chosenLanguage = "english";
    }

    io.sockets.emit("language has been changed", data);
  });

  socket.on("game started", data => {
    currentPlayer = data.startPlayer;
    // this line makes sure, that selectedPieces (joined players) is in the correct order, like the player pieces are rendered (in a beautiful rainbow order):
    // selectedPieces = data.joinedPlayerIds;
    selectedPieces.sort(rainbowSort);
    console.log("joined players at game start: ", selectedPieces);

    // set number of turns:
    if (selectedPieces.length == 3 || selectedPieces.length == 5) {
      numberOfTurnsLeft = 15;
    } else if (selectedPieces.length == 4) {
      numberOfTurnsLeft = 12;
    } else if (selectedPieces.length == 6) {
      numberOfTurnsLeft = 18;
    } else if (selectedPieces.length == 7) {
      numberOfTurnsLeft = 14;
    } else if (selectedPieces.length == 8) {
      numberOfTurnsLeft = 16;
    }
    numberOfTurnsForThisGame = numberOfTurnsLeft;

    console.log(
      `${selectedPieces.length} players joined the game.
      Each player will be the builder ${numberOfTurnsLeft / selectedPieces.length} times!`
    );

    discardPile = cards;
    // discard pile gets shuffled and builds the new stuffCards pile:
    shuffleCards(discardPile);
    // drawCard(stuffCards);
    firstCard = stuffCards.shift();

    playerPointsTotal = {};
    for (let i = 0; i < selectedPieces.length; i++) {
      playerPointsTotal[selectedPieces[i]] = 0;
    }

    correctAnswer = randomNumber(1, 7);
    guessedAnswers = {};
    answeringOrder = [];
    gameStarted = true;
    doneBtnPressed = false;
    guessingOrDiscussionTime = false;

    let msg = `"${data.startPlayer}" started the game and starts with building!`;
    // console.log(msg);

    activeObjects = data.activeObjects;
    queuedObjects = data.queuedObjects;

    io.sockets.emit("game has been started", {
      message: msg,
      startPlayer: data.startPlayer,
      activeObjects: data.activeObjects,
      queuedObjects: data.queuedObjects,
      firstCard: firstCard,
      correctAnswer: correctAnswer,
      numberOfTurnsLeft: numberOfTurnsLeft
    });
  });

  socket.on("ready for next turn", () => {
    io.sockets.emit("ready for next turn");
  });

  socket.on("objects for next turn", data => {
    numberOfTurnsLeft--;
    if (numberOfTurnsLeft == 0) {
      getWinner();
    } else {
      nextPlayersTurn(data);
    }
  });

  socket.on("done building", data => {
    activeObjects = data.movedObjects;
    let msg = `player "${data.activePlayer}" finished building! Guess what it is!`;
    doneBtnPressed = true;
    io.sockets.emit("building is done", {
      message: msg,
      activePlayer: data.activePlayer,
      movedObjects: data.movedObjects
    });
  });

  socket.on("moving objects", data => {
    activeObjects = data.movedObjects;
    io.sockets.emit("objects are moving", {
      activePlayer: data.activePlayer,
      movedObjects: data.movedObjects
    });
  });

  socket.on("made a guess", data => {
    collectGuesses(data);
  });

  socket.on("end game", () => {
    getWinner();
  });

  socket.on("let me rejoin the game", data => {
    console.log('rejoining socketId:', socket.id);

    if (data.selectedPieceId && data.playerName) {
      selectedPieces.push(data.selectedPieceId);
      console.log('selectedPieces after rejoining:', selectedPieces);
      // NOTE: depending on the disconnection (intenet failure / page refresh) there might be double entries in the selected pieces array (because they don't get deleted on "disconnect").. so:
      // NOTE: update: the selected piece WILL get deleted on internet disconnection, BUT: in this case it happens a long time after the same player rejoined the game already.. how do I solve this problem? the rejoining player shouldn't get deleted..
      selectedPieces = [...new Set(selectedPieces)];
      console.log('selectedPieces after filtering double entries:', selectedPieces);
      // now the player piece order is destroyed.. so after someone disconnects/reconnets, resort in rainbow pattern:
      selectedPieces.sort(rainbowSort);
      console.log('selectedPieces after rainbowSort:', selectedPieces);

      joinedPlayers[socket.id] = data.selectedPieceId;
      playerNames[data.selectedPieceId] = data.playerName;
      playerPointsTotal[data.selectedPieceId] = data.myTotalPoints;
      addPlayerMidGame(data);
    }
  });

  socket.on("guesses backup", data => {
    cardPointsHTML = data.cardPointsHTML;
    guessingOrDiscussionTime = true;
  });

  socket.on("disconnect", () => {
    console.log(`socket with the id ${socket.id} is now disconnected`);
    // NOTE: for some reason, this event only fires, when the browser is refreshed; not if it just lost internet connection? --> seems to be delayed, so players will be removed after disconnecting after they actually rejoined :(

    let piece = joinedPlayers[socket.id];
    selectedPieces = selectedPieces.filter(item => item !== piece);
    if (selectedPieces.length == 0) {
      gameStarted = false;
    }
    if (piece) {
      console.log(`player piece "${piece}" is now free again`);
      io.sockets.emit("remove selected piece", piece);
      delete joinedPlayers[socket.id];
      delete playerNames[piece];
      delete playerPointsTotal[piece];
      // TODO: what happens if disconnected player is the game master?
    }
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
});
