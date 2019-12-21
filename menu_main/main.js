// TO DO:
// * how to change click + hovering to only img without their transparent surrounding?
// * update construction area borders when window is resized

const objObj = [
    {
        "name": "banana",
        "images": "banana.png",
        "sound": "405705__apinasaundi__found-matress-hit.wav"
    },
    {
        "name": "bridge",
        "images": ["bridge_v1.png","bridge_v2.png","bridge_v3.png"],
        "sound": "146981__jwmalahy__thud1.wav"
    },
    {
        "name": "cloth",
        "images": ["cloth_v1.png","cloth_v2.png","cloth_v3.png"],
        "sound": "128156__killpineapple__bagoffhead.mp3"
    },
    {
        "name": "coin",
        "images": ["coin_v1.png","coin_v2.png"],
        "sound": "140722__j1987__metalimpact-4.wav"
    },
    {
        "name": "flower",
        "images": ["flower_v1.png","flower_v2.png"],
        "sound": "240784__f4ngy__picking-flower.wav"
    },
    {
        "name": "fur",
        "images": "fur.png",
        "sound": "128156__killpineapple__bagoffhead.mp3"
    },
    {
        "name": "giant",
        "images": ["giant_v1.png","giant_v2.png","giant_v3.png"],
        "sound": "2516__jonnay__dropsine.wav"
    },
    {
        "name": "peg",
        "images": ["peg_v1.png","peg_v2.png"],
        "sound": "61086__andre-nascimento__floppy-disk01.wav"
    },
    {
        "name": "pig",
        "images": ["pig_v1.png","pig_v2.png", "pig_v3.png"],
        "sound": "442907__qubodup__pig-grunt.wav"
    },
    {
        "name": "plane",
        "images": ["plane_v1.png","plane_v2.png", "plane_v3.png"],
        "sound": "61086__andre-nascimento__floppy-disk01.wav"
    },
    {
        "name": "pokerchip",
        "images": "pokerchip.png",
        "sound": "157539__nenadsimic__click.wav"
    },
    {
        "name": "pole",
        "images": "pole.png",
        "sound": "61081__andre-nascimento__pen-on-floor02.wav"
    },
    {
        "name": "puzzle",
        "images": ["puzzle_v1.png","puzzle_v2.png"],
        "sound": "220018__chocktaw__fiji-meow-02.wav"
    },
    {
        "name": "ring",
        "images": ["ring_v1.png","ring_v2.png"],
        "sound": "218823__djtiii__staple-drop.wav"
    },
    {
        "name": "rummikubtile",
        "images": "rummikubtile.png",
        "sound": "157539__nenadsimic__click.wav"
    },
    {
        "name": "scissors",
        "images": "scissors.png",
        "sound": "48641__ohnoimdead__onid-scissor-snap.wav"
    },
    {
        "name": "stone",
        "images": "stone.png",
        "sound": "146981__jwmalahy__thud1.wav"
    },
    {
        "name": "ticket",
        "images": "ticket.png",
        "sound": "157539__nenadsimic__click.wav"
    },
    {
        "name": "token",
        "images": ["token_v1.png","token_v2.png"],
        "sound": "2516__jonnay__dropsine.wav"
    },
    {
        "name": "triangle",
        "images": "triangle.png",
        "sound": "157539__nenadsimic__click.wav"
    }
];

var $objects = $('#objects');

var $constructionArea = $('#construction-area');
var borderTop = $constructionArea.offset().top;
var borderBottom = borderTop + $constructionArea.height();
var borderLeft = $constructionArea.offset().left;
var borderRight = borderLeft + $constructionArea.width();

console.log('borderTop: ', borderTop);
console.log('borderRight: ', borderRight);
console.log('borderBottom: ', borderBottom);
console.log('borderLeft: ', borderLeft);

var objectClicked = false;
var $clickedImgBox;
var $clickedImgId;

var startX;
var startY;

var translateX;
var translateY;

$(document).on('mousedown', '.img-box', function (e) {
    objectClicked = true;
    $clickedImgBox = $(this);
    // console.log($clickedImgBox);
    // show name of clicked object:
    $clickedImgId = $clickedImgBox.find('img').attr('id');
    console.log($clickedImgId);
    $clickedImgBox.addClass('move');
    startX = e.clientX;
    startY = e.clientY;
    // to move an object, that's already in the construction area, check the transform props and calculate with them when invoking updatePosition():
    // get the clicked object to the very front:

    // https://stackoverflow.com/questions/5680770/how-to-find-the-highest-z-index-using-jquery
    var highestZIndex = 0;
    $('.selected').each(function() {
        var currentZIndex = Number($(this).css('z-index'));
        if (currentZIndex > highestZIndex) {
            highestZIndex = currentZIndex;
        }
    });
    $clickedImgBox.css({
        'z-index': highestZIndex + 1
    });

    if ($clickedImgBox.hasClass('selected')) {
        var transformProps = $('.move').css('transform');
        // console.log(transformProps);
        var values = transformProps.split('(')[1],
            values = values.split(')')[0],
            values = values.split(',');
        translateX = Number(values[4]);
        translateY = Number(values[5]);
        // console.log('translateX: ', translateX, 'translateY: ', translateY);
    }
});

$(document).on('mousemove', function(e) {
    if (objectClicked) {
        updatePosition(e);
    }
});

$(document).on('mouseup', function(e) {
    if (objectClicked) {
        // console.log('drop object here:');
        // console.log('cursorposition X: ', e.clientX);
        // console.log('cursorposition Y: ', e.clientY);
        var $clickedImgBox = $('.move');
        var posX = e.clientX;
        var posY = e.clientY;
        let currentObj = objObj.find(obj => obj.name === $clickedImgId);
        let dropSound = new Audio("./sounds/" + currentObj.sound);
        dropSound.play();
        //only if object is dropped inside the construction area:
        if (borderLeft < posX && posX < borderRight &&
            borderTop < posY && posY < borderBottom) {
                $clickedImgBox.addClass('selected');
        // if dropped ouside construction area, put it back to it's original position:
        } else {
            $clickedImgBox.removeClass('selected');
            $clickedImgBox.css({
                transform: `translate(${0}px, ${0}px)`
            });
        }

        $clickedImgBox.removeClass('move');
        objectClicked = false;
    }
});

function updatePosition(event) {
    var $clickedImgBox = $('.move');
    var moveX = event.clientX - startX;
    var moveY = event.clientY - startY;
    // to move an object, that's already in the construction area, check the transform props and calculate with them:
    if ($clickedImgBox.hasClass('selected')) {
        moveX += translateX;
        moveY += translateY;
    }
    $clickedImgBox.css({
        transform: `translate(${moveX}px, ${moveY}px)`
    });
}
