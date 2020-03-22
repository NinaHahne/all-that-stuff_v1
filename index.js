const express = require("express");
const app = express();
// const uuid = require("uuid");

// for socket.io:
const server = require("http").Server(app);
const io = require("socket.io")(server, {
    origins:
        "localhost:8080 http://192.168.0.14:8080:* http://192.168.2.112:8080:* allthatstuff.herokuapp.com:*"
});

// cards:
const cardsEN = require("./cards_enUS");
const cardsDE = require("./cards_de.json");
let cards = cardsEN;
let chosenLanguage = "english";

app.use(express.static("./public"));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/main.html");
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
let numberOfRoundsLeft;

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

// IN THE FUTURE: replace above selectedPieces, guessedAnswers & playerPointsTotal with playersObj:
let playersObj = {};
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

// function drawCard(cards) {
//     firstCard = cards.shift();
// }

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
    io.sockets.emit("next turn", {
        activePlayer: data.activePlayer,
        nextPlayer: nextPlayer,
        activeObjects: data.activeObjects,
        queuedObjects: data.queuedObjects,
        newCard: firstCard,
        correctAnswer: correctAnswer
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
    // let joinedPlayersLength = Object.keys(joinedPlayers).length;
    let joinedPlayersLength = selectedPieces.length;

    // console.log('joinedPlayersLength: ', joinedPlayersLength);
    // console.log('guessedAnswersLength: ', guessedAnswersLength);
    // console.log("guessedAnswers: ", guessedAnswers);

    io.sockets.emit("someone guessed", {
        guessingPlayer: data.guessingPlayer,
        guessedItem: data.guessedItem
    });

    // when everyone guessed:
    if (guessedAnswersLength == joinedPlayersLength - 1) {
        let playerPointsIfCorrect = {};
        let actualPlayerPoints = {};
        let numberOfCorrectGuesses = 0;

        if (joinedPlayersLength <= 6) {
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
            // for more than 6 players (max 8):
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

        playerPointsTotal[currentPlayer] += numberOfCorrectGuesses;

        io.sockets.emit("everyone guessed", {
            activePlayer: currentPlayer,
            correctAnswer: correctAnswer,
            guessedAnswers: guessedAnswers,
            playerPointsIfCorrect: playerPointsIfCorrect,
            actualPlayerPoints: actualPlayerPoints,
            playerPointsTotal: playerPointsTotal
        });
    }
}

function getWinner() {
    // console.log('data.playerArray in getWinner:', data.playerArray);
    // console.log('data.playerPiecesHTML: ', data.playerPiecesHTML);

    let ranking = [];
    for (let player in playerPointsTotal) {
        // console.log(player, ":", playerPointsTotal[player]);
        let name = playerNames[player];
        let playerPointsObj = {
            player: player,
            name: name,
            points: playerPointsTotal[player]
        };
        ranking.push(playerPointsObj);
        // console.log('playerPontsObj in getWinner loop:', playerPontsObj);
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

    let msg = `game is over`;
    io.sockets.emit("game ends", {
        message: msg,
        rankingArray: ranking,
        winner: winner
    });
}

// §§ SOCKET.IO ********************************
io.on("connection", socket => {
    console.log(`socket with the id ${socket.id} is now connected`);
    // console.log('joinedPlayers on connection: ', joinedPlayers);

    // joinedPlayers[socket.id] = "";

    // Generate a v1 (time-based) id:
    // socket.userId = uuid.v1();

    // tell the player they connected, giving them their socket id and the list with players that joined so far:
    socket.emit("welcome", {
        socketId: socket.id,
        // userId: socket.userId,
        selectedPieces: selectedPieces,
        playerNames: playerNames,
        chosenLanguage: chosenLanguage,
        gameStarted: gameStarted
    });

    socket.on("selected piece", data => {
        if (data.selectedPieceId) {
            // console.log('joinedPlayers on "selected piece": ', joinedPlayers);
            console.log(
                `${data.playerName} joined the game with the color ${data.selectedPieceId}'`
            );
            selectedPieces.push(data.selectedPieceId);
            joinedPlayers[socket.id] = data.selectedPieceId;
            playerNames[data.selectedPieceId] = data.playerName;

            // playersObj[data.selectedPieceId].name = data.playerName;

            // https://hackernoon.com/accessing-nested-objects-in-javascript-f02f1bd6387f
            // (playersObj[data.selectedPieceId] || {}).name = data.playerName;
            // console.log('playersObj', playersObj);

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
            // console.log("selectedPieces: ", selectedPieces);
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
        // this line makes sure, that selectedPieces (joined players) is in the correct order, like the player pieces are rendered:
        selectedPieces = data.joinedPlayerIds;
        console.log("joined players at game start: ", selectedPieces);
        let msg = `"${data.startPlayer}" started the game and starts with building!`;
        // console.log(msg);

        // set number of rounds:
        if (selectedPieces.length == 3 || selectedPieces.length == 5) {
            numberOfRoundsLeft = 15;
        } else if (selectedPieces.length == 4) {
            numberOfRoundsLeft = 12;
        } else if (selectedPieces.length == 6) {
            numberOfRoundsLeft = 18;
        } else if (selectedPieces.length == 7) {
            numberOfRoundsLeft = 14;
        } else if (selectedPieces.length == 8) {
            numberOfRoundsLeft = 16;
        }
        console.log(
            `${
                selectedPieces.length
            } players joined the game. Each player will be the builder ${numberOfRoundsLeft /
                selectedPieces.length} times!`
        );

        // console.log('cards on "game started": ', cards);
        discardPile = cards;
        shuffleCards(discardPile); // discard pile gets shuffled and builds the new stuffCards pile
        // drawCard(stuffCards);
        // console.log(`${stuffCards.length} cards left.`);
        firstCard = stuffCards.shift();

        playerPointsTotal = {};
        for (let i = 0; i < selectedPieces.length; i++) {
            playerPointsTotal[selectedPieces[i]] = 0;
        }

        correctAnswer = randomNumber(1, 7);
        guessedAnswers = {};
        answeringOrder = [];
        gameStarted = true;

        io.sockets.emit("game has been started", {
            message: msg,
            startPlayer: data.startPlayer,
            activeObjects: data.activeObjects,
            queuedObjects: data.queuedObjects,
            firstCard: firstCard,
            correctAnswer: correctAnswer
        });
    });

    socket.on("objects for next turn", data => {
        numberOfRoundsLeft--;
        if (numberOfRoundsLeft == 0) {
            getWinner();
        } else {
            nextPlayersTurn(data);
        }
    });

    socket.on("done building", data => {
        let msg = `player "${data.activePlayer}" finished building! Guess what it is!`;
        io.sockets.emit("building is done", {
            message: msg,
            activePlayer: data.activePlayer,
            movedObjects: data.movedObjects
        });
    });

    socket.on("moving objects", data => {
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

    socket.on("disconnect", () => {
        // console.log('joinedPlayers on "disconnect": ', joinedPlayers);
        console.log(`socket with the id ${socket.id} is now disconnected`);
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
        }
    });
});
