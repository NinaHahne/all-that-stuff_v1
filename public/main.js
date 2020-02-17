// io() is apparently actually not undefined?:
var socket = io();

// to prevent image dragging for imgs that are dynamically declared:
// // register onLoad event with anonymous function
// window.onload = function (e) {
//     let evt = e || window.event,// define event (cross browser)
//         imgs,                   // images collection
//         i;                      // used in local loop
//     // if preventDefault exists, then define onmousedown event handlers
//     if (evt.preventDefault) {
//         // collect all images on the page
//         imgs = document.getElementsByTagName('img');
//         // loop through fetched images
//         for (i = 0; i < imgs.length; i++) {
//             // and define onmousedown event handler
//             imgs[i].onmousedown = disableDragging;
//         }
//     }
// };
//
// // disable image dragging
// function disableDragging(e) {
//     e.preventDefault();
// }
// ------------------------------------

// ||| ELEMENTS & GLOBAL VARIABLES ********************************

const $objects = $("#objects");
const $queue = $("#queue");

const $constructionArea = $("#construction-area");
let [borderTop, borderBottom, borderLeft, borderRight] = get$objBorders(
    $constructionArea
);
// console.log(borderTop, borderBottom, borderLeft, borderRight);
const playButton = document.getElementById("play");

// const $body = $('body');
// let [bodyBorderTop, bodyBorderBottom, bodyBorderLeft, bodyBorderRight] = get$objBorders($body);
// console.log(bodyBorderTop, bodyBorderBottom, bodyBorderLeft, bodyBorderRight);
const objObj = [
    {
        name: "banana",
        images: "banana.png",
        sound: "405705__apinasaundi__found-matress-hit.wav"
    },
    {
        name: "bridge",
        images: ["bridge_v1.png", "bridge_v2.png", "bridge_v3.png"],
        sound: "146981__jwmalahy__thud1.wav"
    },
    {
        name: "cloth",
        images: ["cloth_v1.png", "cloth_v2.png", "cloth_v3.png"],
        sound: "128156__killpineapple__bagoffhead.mp3"
    },
    {
        name: "coin",
        images: ["coin_v1.png", "coin_v2.png"],
        sound: "140722__j1987__metalimpact-4.wav"
    },
    {
        name: "flower",
        images: ["flower_v1.png", "flower_v2.png"],
        sound: "240784__f4ngy__picking-flower.wav"
    },
    {
        name: "fur",
        images: "fur.png",
        sound: "128156__killpineapple__bagoffhead.mp3"
    },
    {
        name: "giant",
        images: ["giant_v1.png", "giant_v2.png", "giant_v3.png"],
        sound: "2516__jonnay__dropsine.wav"
    },
    {
        name: "peg",
        images: ["peg_v1.png", "peg_v2.png"],
        sound: "61086__andre-nascimento__floppy-disk01.wav"
    },
    {
        name: "pig",
        images: ["pig_v1.png", "pig_v2.png", "pig_v3.png"],
        sound: "442907__qubodup__pig-grunt.wav"
    },
    {
        name: "plane",
        images: ["plane_v1.png", "plane_v2.png", "plane_v3.png"],
        sound: "61086__andre-nascimento__floppy-disk01.wav"
    },
    {
        name: "pokerchip",
        images: "pokerchip.png",
        sound: "157539__nenadsimic__click.wav"
    },
    {
        name: "pole",
        images: "pole.png",
        sound: "61081__andre-nascimento__pen-on-floor02.wav"
    },
    {
        name: "puzzle",
        images: ["puzzle_v1.png", "puzzle_v2.png"],
        sound: "220018__chocktaw__fiji-meow-02.wav"
    },
    {
        name: "ring",
        images: ["ring_v1.png", "ring_v2.png"],
        sound: "218823__djtiii__staple-drop.wav"
    },
    {
        name: "rummikubtile",
        images: "rummikubtile.png",
        sound: "157539__nenadsimic__click.wav"
    },
    {
        name: "scissors",
        images: "scissors.png",
        sound: "48641__ohnoimdead__onid-scissor-snap.wav"
    },
    {
        name: "stone",
        images: "stone.png",
        sound: "146981__jwmalahy__thud1.wav"
    },
    {
        name: "ticket",
        images: "ticket.png",
        sound: "157539__nenadsimic__click.wav"
    },
    {
        name: "token",
        images: ["token_v1.png", "token_v2.png"],
        sound: "2516__jonnay__dropsine.wav"
    },
    {
        name: "triangle",
        images: "triangle.png",
        sound: "157539__nenadsimic__click.wav"
    }
];
const objects = document.getElementById("ticker-objects");
let objectList = objects.getElementsByClassName("img-box"); //objectList[0] is always the first link in the list.. list stays in sync
let left = objects.offsetLeft; //number (in px), x-position of element relative to its parent
let myReq;
let gameStarted = false;

let players = [];
// let myUserId = sessionStorage.getItem('myUserId');
let mySocketId;
let selectedPieceId = sessionStorage.getItem('selectedPieceId');

// ||| START MENU ************************************************
shuffleObjects(objects);
moveObjects();

// EVENT LISTENERS - start menu
playButton.addEventListener("click", function() {
    // e.preventDefault();
    cancelAnimationFrame(myReq);
    // console.log(Array.isArray(objectList));
    let objectArray = Array.from(objectList);
    // console.log(Array.isArray(objectArray));
    gameStarted = true;
    startGame(objectArray);
});

$(document).on("click", ".player", e => {
    // console.log('e.target: ', e.target);
    // console.log('e.currentTarget: ', e.currentTarget);
    // console.log('clicked select players');
    console.log(
        "clicked element is already taken: ",
        $(e.target).hasClass("selectedPlayerPiece")
    );
    // if you haven't yet selected a piece and it's not taken by another player:
    console.log('your selectedPieceId', selectedPieceId);
    if (!selectedPieceId && !$(e.target).hasClass("selectedPlayerPiece")) {
        selectedPieceId = $(e.target).attr("id");
        selectedPiece(selectedPieceId);
    }
});

function selectedPiece(pieceId) {
    sessionStorage.setItem('selectedPieceId', pieceId);
    let $piece = $("#" + pieceId);
    // console.log('$piece: ', $piece);
    $piece.addClass("selectedPlayerPiece");
    $piece.addClass("myPiece");
    players.push(pieceId);
    // console.log('$piece[0].innerText: ', $piece[0].innerText);
    $piece[0].innerText = '!';
    console.log('players in selectedPiece(): ', players);
    socket.emit("selected piece", {
        // userId: myUserId,
        socketId: mySocketId,
        selectedPieceId: pieceId
    });
}

function updateSelectedPlayers(pieceId) {
    // maybe pieceId is undefined at some point? just a guess for the jquery err when reloading page after changing main.js: Uncaught Error: Syntax error, unrecognized expression: # ... at Function.oe.error...
    // error does not occur with this conditional:
    if (pieceId) {
        let $piece = $("#" + pieceId);
        // console.log('$piece: ', $piece);
        $piece.addClass("selectedPlayerPiece");
        players.push(selectedPieceId);
    }
}

function removePlayer(pieceId) {
    // only if the disconnected player had chosen a piece and it's not "":
    if (pieceId) {
        let $piece = $("#" + pieceId);
        // console.log('$piece: ', $piece);
        $piece.removeClass("selectedPlayerPiece");

        players = players.filter(item => item !== pieceId);
    }
}

function moveObjects() {
    // left = left - 2;
    left--;
    // console.log(left);
    if (left < -objectList[0].offsetWidth) {
        //true when first link is off screen..
        // add to left the width of the currently first link
        let widthOfFirstObject = objectList[0].offsetWidth; //use clientWidth instead?
        // console.log(widthOfFirstObject);
        left += widthOfFirstObject;
        // make first link the last link
        objects.appendChild(objectList[0]); //appending will actually remove it from the start and add it to the end
    }
    myReq = requestAnimationFrame(moveObjects); //like setTimeout, but the waiting time is adjusted to the framerate of used hardware(?)
    objects.style.left = left + "px";
}

//based on Fisher–Yates shuffle //By Alexey Lebedev :
function shuffleObjects(objects) {
    for (let i = objects.children.length; i >= 0; i--) {
        objects.appendChild(objects.children[(Math.random() * i) | 0]);
    }
}

function startGame(objArray) {
    let activeObjects = objArray.slice(0, 10);
    let queuedObjects = objArray.slice(10);
    queuedObjects.reverse();
    $objects.append(activeObjects);
    $queue.append(queuedObjects);
    getObjectPositions();
    $(".hidden").removeClass("hidden");
    $("#start-menu").addClass("hidden");

    socket.emit("game started", players[0]);
}

// ||| sockets - start menu:
socket.on("welcome", function(data) {

    sessionStorage.setItem('mySocketId', data.socketId);
    mySocketId = data.socketId;
    console.log(
        `Connected successfully to the socket.io server. My socketID is ${data.socketId}.`
    );
    players = data.selectedPieces;
    console.log('players in socket.on("welcome"): ', players);
    for (let i = 0; i < players.length; i++) {
        let $piece = $("#" + players[i]);
        // console.log('$piece: ', $piece);
        $piece.addClass("selectedPlayerPiece");
        // to remember the selected piece on page reload:
        if ($piece.attr("id") == selectedPieceId) {
            $piece.addClass("myPiece");
            $piece[0].innerText = '!';
            // emit 'selected piece' here too?
            socket.emit("selected piece", {
                socketId: mySocketId,
                selectedPieceId: selectedPieceId
            });
        }
    }
});

socket.on("add selected piece", function(selectedPieceId) {
    updateSelectedPlayers(selectedPieceId);
});

socket.on("remove selected piece", function(piece) {
    removePlayer(piece);
});

socket.on("game started", function(data) {
    console.log(data);
});

// || MAIN GAME ************************************************

// function getConstructionAreaBorders() {
//     borderTop = $constructionArea.offset().top;
//     borderBottom = borderTop + $constructionArea.height();
//     borderLeft = $constructionArea.offset().left;
//     borderRight = borderLeft + $constructionArea.width();
//     // console.log('borderTop: ', borderTop);
//     // console.log('borderRight: ', borderRight);
//     // console.log('borderBottom: ', borderBottom);
//     // console.log('borderLeft: ', borderLeft);
// };
// getConstructionAreaBorders();

// function getBodyBorders() {
//     bodyBorderTop = $body.offset().top;
//     bodyBorderBottom = bodyBorderTop + $body.height();
//     bodyBorderLeft = $body.offset().left;
//     bodyBorderRight = bodyBorderLeft + $body.width();
//     // console.log('bodyBorderTop: ', bodyBorderTop);
//     // console.log('bodyBorderRight: ', bodyBorderRight);
//     // console.log('bodyBorderBottom: ', bodyBorderBottom);
//     // console.log('bodyBorderLeft: ', bodyBorderLeft);
// };
// getBodyBorders();

function get$objBorders($obj) {
    let top = $obj.offset().top;
    let bottom = top + $obj.height();
    let left = $obj.offset().left;
    let right = left + $obj.width();
    return [top, bottom, left, right];
}

function getObjectPositions() {
    $objects.children().each(function() {
        // position() gives position relative to positioned parent
        let objTop = $(this).position().top;
        let objLeft = $(this).position().left;
        // console.log('objTop: ', objTop, 'objLeft: ', objLeft);
        $(this).css({
            // position: 'absolute',
            top: objTop + "px",
            left: objLeft + "px"
        });
    });
    $objects.children(".img-box").css({
        position: "absolute"
    });
}
// getObjectPositions();

let objectClicked = false;
let objectMoved = false;
let $clickedImgBox;
let $clickedImgId;

let startX;
let startY;
let moveX;
let moveY;
// let ignoreX = 0;
// let ignoreY = 0;

let translateX;
let translateY;

const ringDropSound = new Audio("./sounds/218823__djtiii__staple-drop.wav");
const universalDropSound = new Audio("./sounds/157539__nenadsimic__click.wav");
let uniSound = true;
let muted = false;

window.addEventListener("resize", () => {
    [borderTop, borderBottom, borderLeft, borderRight] = get$objBorders(
        $constructionArea
    );
    // [bodyBorderTop, bodyBorderBottom, bodyBorderLeft, bodyBorderRight] = get$objBorders($body);
    // console.log(bodyBorderTop, bodyBorderBottom, bodyBorderLeft, bodyBorderRight);
});

$(document).on("mousedown", ".img-box", function(e) {
    if (gameStarted) {
        objectClicked = true;
        $clickedImgBox = $(this);
        // console.log($clickedImgBox);
        // show name of clicked object:
        $clickedImgId = $clickedImgBox.find("img").attr("id");
        console.log($clickedImgId);
        $clickedImgBox.addClass("move");
        startX = e.clientX;
        startY = e.clientY;
        // to move an object, that's already in the construction area, check the transform props and calculate with them when invoking updatePosition():
        // get the clicked object to the very front:

        // https://stackoverflow.com/questions/5680770/how-to-find-the-highest-z-index-using-jquery
        let highestZIndex = 0;
        $(".selected").each(function() {
            const currentZIndex = Number($(this).css("z-index"));
            if (currentZIndex > highestZIndex) {
                highestZIndex = currentZIndex;
            }
        });
        $clickedImgBox.css({
            "z-index": highestZIndex + 1
        });

        if ($clickedImgBox.hasClass("selected")) {
            const transformProps = $(".move").css("transform");
            // console.log(transformProps);
            var values = transformProps.split("(")[1],
                values = values.split(")")[0],
                values = values.split(",");
            translateX = Number(values[4]);
            translateY = Number(values[5]);
            // console.log('translateX: ', translateX, 'translateY: ', translateY);
        }
    }
});

$(document).on("mousemove", function(e) {
    if (objectClicked) {
        updatePosition(e);
    }
});

$(document).on("mouseup", function(e) {
    if (objectClicked) {
        // console.log('drop object here:');
        // console.log('cursorposition X: ', e.clientX);
        // console.log('cursorposition Y: ', e.clientY);
        const $clickedImgBox = $(".move");
        const posX = e.clientX;
        const posY = e.clientY;
        if (!muted && objectMoved) {
            if (uniSound) {
                universalDropSound.play();
            } else {
                const currentObj = objObj.find(
                    obj => obj.name === $clickedImgId
                );
                new Audio("./sounds/" + currentObj.sound).play();
            }
        }
        //only if object is dropped (when cursor is) inside the construction area:
        if (
            borderLeft < posX &&
            posX < borderRight &&
            borderTop < posY &&
            posY < borderBottom
        ) {
            $clickedImgBox.addClass("selected");
            // if dropped ouside construction area, put it back to it's original position:
        } else {
            $clickedImgBox.removeClass("selected");
            $clickedImgBox.css({
                transform: `translate(${0}px, ${0}px)`
            });
        }
        $clickedImgBox.removeClass("move");
        objectClicked = false;
        objectMoved = false;
    }
});

// toggle sound / mute / discard used objects and refill:
$(document).on("keydown", e => {
    if (e.keyCode == 83) {
        // = "S"
        if (uniSound) {
            ringDropSound.play();
            uniSound = false;
        } else {
            universalDropSound.play();
            uniSound = true;
        }
    } else if (e.keyCode == 77) {
        // = "M"
        if (muted) {
            muted = false;
            if (uniSound) {
                universalDropSound.play();
            } else {
                ringDropSound.play();
            }
        } else {
            muted = true;
        }
    } else if (e.keyCode == 13) {
        // = "enter"
        discardAndRefillObjects();
    }
});

$(document).on("dblclick", ".img-box", e => {
    // console.log('img-box was double clicked!');
    // console.log(e.currentTarget);
    let imgBox = e.currentTarget;
    changeObjectImage(imgBox);
});

function changeObjectImage(imgBox) {
    if (!$(imgBox).hasClass("only1")) {
        // console.log('more than one image!');
        const img = imgBox.querySelector("img");
        // console.log(img.id);
        // console.log(img.src);
        const srcNameV = img.src.split(".png")[0];
        const newSrcBase = srcNameV.substring(0, srcNameV.length - 1);
        // console.log('active image version: ', srcNameV[srcNameV.length - 1]);
        if ($(imgBox).hasClass("more2")) {
            if ($(imgBox).hasClass("v1")) {
                img.src = newSrcBase + 2 + ".png";
                $(imgBox)
                    .removeClass("v1")
                    .addClass("v2");
            } else if ($(imgBox).hasClass("v2")) {
                img.src = newSrcBase + 1 + ".png";
                $(imgBox)
                    .removeClass("v2")
                    .addClass("v1");
            }
        } else if ($(imgBox).hasClass("more3")) {
            if ($(imgBox).hasClass("v1")) {
                img.src = newSrcBase + 2 + ".png";
                $(imgBox)
                    .removeClass("v1")
                    .addClass("v2");
            } else if ($(imgBox).hasClass("v2")) {
                img.src = newSrcBase + 3 + ".png";
                $(imgBox)
                    .removeClass("v2")
                    .addClass("v3");
            } else if ($(imgBox).hasClass("v3")) {
                img.src = newSrcBase + 1 + ".png";
                $(imgBox)
                    .removeClass("v3")
                    .addClass("v1");
            }
        }
    } else {
        console.log("this object has only one image!");
    }

    // let currentObj = objObj.find(obj => obj.name === img.id);
    // console.log(currentObj.images);
}

function discardAndRefillObjects() {
    const numberOfUsedObjects = $(".selected").length;
    // console.log($queue.children().last().attr("class"));
    $objects.children(".img-box").css({
        position: "unset"
    });
    $(".selected").each(function() {
        $queue.prepend($(this));
        $(this).removeClass("selected");
        $(this).css({
            position: "unset",
            transform: `translate(${0}px, ${0}px)`,
            "z-index": 1
        });
    });
    for (let i = 0; i < numberOfUsedObjects; i++) {
        // console.log($queue.children().last().attr("class"));
        $objects.append($queue.children().last());
    }
    getObjectPositions();
}

function updatePosition(event) {
    objectMoved = true;
    const $clickedImgBox = $(".move");

    moveX = event.clientX - startX;
    moveY = event.clientY - startY;

    // // only update position, if object is inside body:
    // let [top, bottom, left, right] = get$objBorders($clickedImgBox);
    //
    // if (bodyBorderLeft < left && right < bodyBorderRight) {
    //     moveX = event.clientX - startX - ignoreX;
    // } else {
    //     // ---------- check here in which direction the mousemove is heading and update if direction is away from the body-border
    //     console.log('object outside X body!');
    //     // console.log(event.clientX);
    //     ignoreX = event.clientX;
    // }
    //
    // if (bodyBorderTop < top && bottom < bodyBorderBottom) {
    //     moveY = event.clientY - startY - ignoreY;
    // } else {
    //     // ---------- check here in which direction the mousemove is heading and update if direction is away from the body-border
    //     console.log('object outside Y body!');
    //     // console.log(event.clientY);
    //     ignoreY = event.clientY;
    // }

    // to move an object, that's already in the construction area, check the transform props and calculate with them:
    if ($clickedImgBox.hasClass("selected")) {
        moveX += translateX;
        moveY += translateY;
    }

    $clickedImgBox.css({
        transform: `translate(${moveX}px, ${moveY}px)`
    });
}
