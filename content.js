if (!window.hasOwnProperty("tiktokExtensionInitialized")) {
  window.tiktokExtensionInitialized = true;

  console.log("Content script loaded");

  // Inform that the content script is ready
  chrome.runtime.sendMessage({ action: "contentScriptReady" });

  let searchInterval;

  async function searchAndInteract(keywords, commentTemplate) {
    try {
      // If we're not already on the search page, navigate to it
      if (!window.location.href.includes("/search")) {
        const searchTerm = Array.isArray(keywords) ? keywords[0] : keywords;
        window.location.href = `https://www.tiktok.com/search?q=${encodeURIComponent(
          searchTerm
        )}`;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    } catch (error) {
      console.error("Error in searchAndInteract:", error);
    }
  }

  // Error handling
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error("Content Script Error:", msg, "at", lineNo, ":", columnNo);
    return false;
  };

  // Add this message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);

    if (request.action === "startSearch") {
      isSearching = true;
      searchAndInteract(request.keywords, request.commentTemplate);
      sendResponse({ status: "started" });
    }

    if (request.action === "stopSearch") {
      isSearching = false;
      if (searchInterval) clearInterval(searchInterval);
      sendResponse({ status: "stopped" });
    }

    return true; // Required for async response
  });
}
