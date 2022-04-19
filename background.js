chrome.action.onClicked.addListener(getCurrentTab);

function getCurrentTab(){
    console.log("yea");
    let capture = chrome.tabs.captureVisibleTab(null, {}, function(dataUrl){
        /*var img=new Image();
        img.src=dataUrl;
        return cropPlusExport(img,10,100,100,100);*/
        console.log(dataUrl);
    });
    console.log(capture);
}


function cropPlusExport(img, cropX, cropY, cropWidth, cropHeight){
    var canvas1 = new OffscreenCanvas(100,100);
    var ctx1 = canvas1.getContext('2d');
    console.log(ctx1)
    canvas1.width = cropWidth;
    canvas1.height = cropHeight;
    // use the extended from of drawImage to draw the
    // cropped area to the temp canvas
    ctx1.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    // return the .toDataURL of the temp canvas
    return(canvas1.toDataURL());
}
