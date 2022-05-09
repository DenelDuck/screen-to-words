// modern Chrome requires { passive: false } when adding event
var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; } 
  }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

var divOverlay;

chrome.runtime.sendMessage({msg: "getCurrentTab"}, function(response) {
    console.log(response.imgsrc);
    createOverlay();
    down = false;
    up = false;
    var x1, y1, x2, y2;
    // TODO: make sure mousedown is called first
    window.addEventListener('mousedown', function(event) {
        console.log("down");
        positions = mousePos(event);
        x1 = positions[0];
        y1 = positions[1];
        down = true;
        console.log(down, x1, y1);
        if(down && up){
            getImage(response.imgsrc, x1, y1, x2, y2);
            removeOverlay();
        }
    }, {once: true})
    window.addEventListener('mouseup', function(event) {
        console.log("up");
        positions = mousePos(event);
        x2 = positions[0];
        y2 = positions[1];
        up = true;
        console.log(up, x2, y2);
        if(down && up){
            getImage(response.imgsrc, x1, y1, x2, y2);
            removeOverlay();
        }
    }, {once: true})
});

function createOverlay(){
    divOverlay = document.createElement("div");
    divOverlay.id = "screen-to-text-overlay"
    divOverlay.setAttribute("style", `position: fixed;
    display: block;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    z-index: 2;
    cursor: pointer;`)
    document.body.appendChild(divOverlay);
    disableScroll();
}

function removeOverlay(){
    divOverlay.remove();
    enableScroll();
}

// Turning on/off scrolling taken from https://stackoverflow.com/a/4770179/18905024
// left: 37, up: 38, right: 39, down: 40,
// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
var keys = {37: 1, 38: 1, 39: 1, 40: 1};

function preventDefault(e) {
  e.preventDefault();
}

function preventDefaultForScrollKeys(e) {
  if (keys[e.keyCode]) {
    preventDefault(e);
    return false;
  }
}

// call this to Disable
function disableScroll() {
  window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
  window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
  window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
  window.addEventListener('keydown', preventDefaultForScrollKeys, false);
}

// call this to Enable
function enableScroll() {
  window.removeEventListener('DOMMouseScroll', preventDefault, false);
  window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
  window.removeEventListener('touchmove', preventDefault, wheelOpt);
  window.removeEventListener('keydown', preventDefaultForScrollKeys, false);
}

function getImage(imgsrc, x1, y1, x2, y2){
    width = x2 - x1;
    height = y2 - y1;
    console.log("loading image")
    var img = new Image();
    img.src = imgsrc;
    img.onload = () => {
        console.log(cropPlusExport(img, x1, y1, width, height));
    };
}

function cropPlusExport(img, cropX, cropY, cropWidth, cropHeight){
    console.log("cropping image");	
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    // return the .toDataURL of the temp canvas
    return(canvas.toDataURL());
}

function mousePos(event) {
    var eventDoc, doc, body;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    /*if (event.pageX == null && event.clientX != null) {
        eventDoc = (event.target && event.target.ownerDocument) || document;
        doc = eventDoc.documentElement;
        body = eventDoc.body;

        event.pageX = event.clientX +
            (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
            (doc && doc.clientLeft || body && body.clientLeft || 0);
        event.pageY = event.clientY +
            (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
            (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }*/
    return [event.pageX, event.pageY - window.pageYOffset];
}