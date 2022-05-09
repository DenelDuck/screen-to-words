chrome.runtime.sendMessage({msg: "getCurrentTab"}, function(response) {
    console.log(response.imgsrc);
    window.addEventListener("mouseup", () => console.log("up"));
    window.addEventListener("mousedown", () => console.log("down"));
    
    var img = new Image();
    img.src = response.imgsrc;
    img.onload = () => {
        console.log(cropPlusExport(img, 0, 0, 1500, 400));
    };
    
});

function cropPlusExport(img, cropX, cropY, cropWidth, cropHeight){
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext('2d');

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(img, cropX, cropY,    cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    // return the .toDataURL of the temp canvas
    return(canvas.toDataURL());
}