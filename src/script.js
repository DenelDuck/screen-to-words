

var supportsPassive = false;
try {
  window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
    get: function () { supportsPassive = true; } 
  }));
} catch(e) {}

var wheelOpt = supportsPassive ? { passive: false } : false;
var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

var divOverlay;
var divSelection;
var x1, y1, x2, y2;
down = false;
up = false;

document.body.style.overflow = "hidden";
document.onload = () => {};
chrome.runtime.sendMessage({msg: "getCurrentTab"}, function(response) {
    console.log(response.imgsrc);
    createOverlay();
    // TODO: make sure mousedown is called first
    window.addEventListener('mousedown', function(event) {
        console.log("down");
        positions = mousePos(event);
        x1 = positions[0];
        y1 = positions[1];
        down = true;
        console.log(down, x1, y1);
        window.addEventListener('mousemove', showSelection);
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
    background-color: rgba(0,0,0,0);
    z-index: 9999;
    cursor: pointer;`)
    document.body.appendChild(divOverlay);
    disableScroll();
}

function removeOverlay(){
    window.removeEventListener('mousemove', showSelection);
    if (typeof divOverlay !== "undefined"){
        divOverlay.remove();
        divOverlay = undefined;
    }
    if (typeof divSelection !== "undefined"){
        divSelection.remove();
        divSelection = undefined;
    }
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

// creates a selection box on the page, x1 and y1 must be set first
function showSelection(event){
    if (typeof x1 === "undefined" || typeof y1 === "undefined"){
        console.log("x1 or y1 not set");
        return;
    }
    
    if (typeof divSelection === "undefined"){
        console.log("creating selection");
        divSelection = document.createElement("div");
        divSelection.id = "screen-to-text-selection-overlay"
        divSelection.setAttribute("style", 
        `
        border: 3px dotted rgba(105, 105, 105, 0.5);
        cursor: pointer;
        display: block;
        position: fixed;
        top: ${y1}px;
        left: ${x1}px;
        height: ${event.pageY - window.pageYOffset - y1}px;
        width: ${event.pageX - x1}px;
        background-color: rgba(83,83,83,0.3);
        z-index: 99999;
        
        `)
        document.body.appendChild(divSelection);
        console.log(divSelection.style.width, divSelection.style.height);
    } else {
        //console.log("updating selection");
        divSelection.style.height = event.pageY - window.pageYOffset - y1 + "px";	
        divSelection.style.width = event.pageX - x1 + "px";
        //console.log( divSelection.style.width, divSelection.style.height,);
    }
}

function getImage(imgsrc, x1, y1, x2, y2){
    width = x2 - x1;
    height = y2 - y1;
    console.log("loading image")
    console.log(width, height);
    var img = new Image();
    img.onload = () => {
        console.log("image loaded");
        var resImg = cropPlusExport(img, x1, y1, width, height);
        var text = await getTextFromImage(resImg);
        console.log("text", text);
    };
    img.src = imgsrc;

}

async function getTextFromImage(img){
    //const rectangle = {left: x1 * (img.width / window.innerWidth), top: y1 * (img.height / window.innerHeight), width: (x2 - x1) * (img.width / window.innerWidth), height: (y2 - y1) * (img.height / window.innerHeight)};
    const worker = Tesseract.createWorker({
        logger: m => console.log(m)
      });
    console.log(img);
    (async () => {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(img);
        console.log(text);
        await worker.terminate();
        return text;
    })();
}

function cropPlusExport(img, cropX, cropY, cropWidth, cropHeight){
    console.log("cropping image");	
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');


    // scale canvas size and cropping coordinates to match the image aspect ratio
    // because captureVisibleTab() returns a full-sized image, but the browser renders a lower
    // quality image for the client, thus pixel coordinates and sizes are not the same
    console.log((img.width / window.innerWidth), (img.height / window.innerHeight));

    var imageToWindowRatio = img.width / window.innerWidth;
    canvas.width = cropWidth * imageToWindowRatio;
    canvas.height = cropHeight * imageToWindowRatio;
    cropX = cropX * imageToWindowRatio;
    cropY = cropY * imageToWindowRatio;
    console.log(canvas.width, canvas.height)
    
    ctx.drawImage(img, cropX, cropY, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    // return the .toDataURL of the temp canvas
    return(canvas.toDataURL(0, 0, canvas.width, canvas.height)/*canvas.toDataURL()*/);
}

function mousePos(event) {
    /*var eventDoc, doc, body;

    event = event || window.event; // IE-ism

    // If pageX/Y aren't available and clientX/Y are,
    // calculate pageX/Y - logic taken from jQuery.
    // (This is to support old IE)
    if (event.pageX == null && event.clientX != null) {
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