// TO DO:
// * how to change click + hovering to only img without their transparent surrounding?
// * update construction area borders when window is resized

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
var startX;
var startY;

var translateX;
var translateY;

$(document).on('mousedown', '.img-box', function (e) {
    objectClicked = true;
    $clickedImgBox = $(this);
    // console.log($clickedImgBox);
    // show name of clicked object:
    var $clickedImgId = $clickedImgBox.find('img').attr('id');
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
