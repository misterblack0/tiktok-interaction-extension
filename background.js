chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

// Handle connection errors
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in background:", message);
  return true;
});
