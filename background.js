chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: ["script.js"]
    })
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(sender.tab ?
        "from a content script:" + sender.tab.url :
        "from the extension");
    if (request.msg === "getCurrentTab") {
        chrome.tabs.captureVisibleTab(null, {format: "png"}, function(dataUrl){
            sendResponse({imgsrc: dataUrl});
        });
        return true;
    }
});


