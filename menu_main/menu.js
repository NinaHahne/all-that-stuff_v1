//iife, to protect all variables
(function() {
    var objects = document.getElementById("objects");
    shuffleObjects(objects);
    var objectList = objects.getElementsByClassName("img-box"); //objectList[0] is always the first link in the list.. list stays in sync
    var left = objects.offsetLeft; //number (in px), x-position of element relative to its parent
    var myReq;
    moveObjects();

    var playButton = document.getElementById("play");

    var objectsAreMoving = false;

    playButton.addEventListener("click", function() {
        if (objectsAreMoving) {
            cancelAnimationFrame(myReq);
            objectsAreMoving = false;
            console.log(objectList);
        } else {
            objectsAreMoving = true;
            myReq = requestAnimationFrame(moveObjects);
        }
    });

    function moveObjects() {
        objectsAreMoving = true;
        // left = left - 2;
        left--;
        // console.log(left);
        if (left < -objectList[0].offsetWidth) {
          //true when first link is off screen..
          // add to left the width of the currently first link
          var widthOfFirstObject = objectList[0].offsetWidth; //use clientWidth instead?
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
        for (var i = objects.children.length; i >= 0; i--) {
        objects.appendChild(objects.children[(Math.random() * i) | 0]);
        }
    }
})();
