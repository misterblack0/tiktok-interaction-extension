console.log("Content script initial load");

// Wrap everything in an IIFE (Immediately Invoked Function Expression)
(function () {
  if (window.tiktokExtensionInitialized) {
    console.log("Content script already initialized");
    return;
  }

  window.tiktokExtensionInitialized = true;
  console.log("Content script initialization started");

  let isSearching = false;
  let searchInterval = null;

  async function waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Element ${selector} not found within ${timeout}ms`);
  }

  async function searchAndInteract(keywords, commentTemplate) {
    console.log("searchAndInteract called with:", {
      keywords,
      commentTemplate,
    });
    try {
      if (!window.location.href.includes("/search")) {
        const searchTerm = Array.isArray(keywords) ? keywords[0] : keywords;
        const searchUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(
          searchTerm
        )}`;
        console.log("Navigating to:", searchUrl);
        window.location.href = searchUrl;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        console.log("On search page, looking for videos...");

        try {
          // Wait for the search results container to appear
          const searchElementsElement = await waitForElement(
            "#tabs-0-panel-search_top > div > div"
          );

          // Get all video elements
          const videoElements = Array.from(searchElementsElement.children);
          console.log("Found video elements:", videoElements.length);

          if (videoElements.length > 0) {
            // Find the first video that has a valid link
            for (const videoElement of videoElements) {
              const videoLink = videoElement.querySelector("a");
              if (
                videoLink &&
                videoLink.href &&
                videoLink.href.includes("/video/")
              ) {
                console.log("Navigating to video:", videoLink.href);
                // window.location.href = videoLink.href;
                break;
              }
            }
          } else {
            console.log("No video elements found");
          }

          // Log details about all found videos
          videoElements.forEach((element, index) => {
            const link = element.querySelector("a");
            console.log(`Video ${index + 1}:`, {
              hasLink: !!link,
              href: link?.href,
              element: element,
            });
          });
        } catch (error) {
          console.error("Error while processing search results:", error);
        }
      }
    } catch (error) {
      console.error("Error in searchAndInteract:", error);
    }
  }

  // Message listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received in content script:", request);

    try {
      if (request.action === "startSearch") {
        console.log("Starting search with:", request.keywords);
        isSearching = true;
        searchAndInteract(request.keywords, request.commentTemplate);
        sendResponse({ status: "started" });
      }

      if (request.action === "stopSearch") {
        console.log("Stopping search");
        isSearching = false;
        if (searchInterval) {
          clearInterval(searchInterval);
        }
        sendResponse({ status: "stopped" });
      }
    } catch (error) {
      console.error("Error in message listener:", error);
      sendResponse({ status: "error", error: error.message });
    }

    return true; // Keep channel open for async response
  });

  // Inform that the content script is ready
  chrome.runtime
    .sendMessage({
      action: "contentScriptReady",
      timestamp: new Date().toISOString(),
    })
    .catch((error) => console.error("Error sending ready message:", error));

  console.log("Content script initialization completed");
})();
