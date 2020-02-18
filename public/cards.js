// TO DO:
// * Browser zum Neuladen erzwingen? (nicht aus cache laden)
// * Karten immer gleichgroß, Inhalt soll sich anpassen -> fitty?

let section = document.querySelector("section");
let buttonBox = document.getElementsByClassName("buttonBox");

let cardTitle = document.getElementsByClassName("cardtitle");
let bullets = document.getElementsByClassName("bullet");
let items = document.getElementsByClassName("item");

//load JSON file:

//INSTEAD: request.addEventListener('readystatechange', function(){}...).. but there is a less tedious way: jQuery.ajax

let requestURL = "https://ninahahne.github.io/AllThatStuff/cards_enUS.json";
let request = new XMLHttpRequest();
request.open("GET", requestURL);
request.responseType = "json";
request.send();

let stuffCards = [];
let discardPile = [];
let firstCard;
let newPile = false;

request.onload = function() {
    // draws a card as soon as JSON file is loaded
    let cards = request.response;
    // console.log(cards);
    discardPile = cards;
    shuffleCards(discardPile); // discard pile gets shuffled and builds the new stuffCards pile
    drawCard(stuffCards);
};

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

function drawCard(cards) {
    firstCard = cards.shift();
    cardTitle[0].innerHTML = firstCard.title;
    let cardItems = firstCard.items;
    for (let i = 0; i < cardItems.length; i++) {
        items[i].innerHTML = cardItems[i];
    }
    let message = `you drew card number ${firstCard.id}.`;
    console.log(message); //TEST
}

function discardCard() {
    if (newPile === false) {
        discardPile.push(firstCard);
    }
    console.log(`${discardPile.length} cards in the discard pile.`); //TEST
    console.log(`${stuffCards.length} cards left.`); //TEST

    cardTitle[0].innerHTML = "";
    for (let i = 0; i < items.length; i++) {
        items[i].innerHTML = "";
    }
}

function replaceCard() {
    if (newPile === true) {
        let buttonText =
            '<button type="submit"  onClick="replaceCard();">draw new card</button>';
        buttonBox[0].innerHTML = buttonText;
    }
    discardCard();
    if (stuffCards.length > 0) {
        newPile = false;
        drawCard(stuffCards);
    } else {
        let shuffleButtonText =
            '<button type="submit"  onClick="replaceCard();">shuffle cards<br>&<br>draw a new one</button>';
        buttonBox[0].innerHTML = shuffleButtonText;

        shuffleCards(discardPile);
        newPile = true;
    }
}

//for testing only, call via console:
function drawCardWithId(cardId) {
    // moves a card with given cardId to the top of the draw pile (if it is in the draw pile)
    let wantedCard = stuffCards.find(card => card.id == cardId);
    if (wantedCard != undefined) {
        let cardIndex = stuffCards.indexOf(wantedCard);
        stuffCards.splice(cardIndex, 1); // removes wantedCard from pile (and returns array containing wantedCard object)
        stuffCards.unshift(wantedCard); // adds wantedCard to the top of the draw pile
        console.log(wantedCard);
    } else {
        console.log(wantedCard);
        console.log("requested card is not in the draw pile.");
    }
}
