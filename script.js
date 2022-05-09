chrome.runtime.sendMessage({msg: "getCurrentTab"}, function(response) {
    console.log(response.imgsrc);
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
        }
    }, {once: true})
});

function getImage(imgsrc, x1, y1, x2, y2){
    width = x2 - x1;
    height = y2 - y1;
    console.log("loading image")
    var img = new Image();
    img.src = imgsrc;
    img.onload = () => {
        console.log("yea")
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
    }
    return [event.pageX, event.pageY];
}