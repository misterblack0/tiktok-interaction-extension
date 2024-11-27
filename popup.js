document.addEventListener("DOMContentLoaded", function () {
  const startButton = document.getElementById("start-search");
  const stopButton = document.getElementById("stop-search");
  const keywordsInput = document.getElementById("keywords");
  const commentInput = document.getElementById("comment-text");
  const statusDiv = document.getElementById("status");

  // Load saved settings
  chrome.storage.local.get(["keywords", "commentTemplate"], function (data) {
    if (data.keywords) keywordsInput.value = data.keywords;
    if (data.commentTemplate) commentInput.value = data.commentTemplate;
  });

  startButton.addEventListener("click", async function () {
    const keywords = keywordsInput.value.split(",").map((k) => k.trim());
    const commentTemplate = commentInput.value;

    // Save settings
    await chrome.storage.local.set({
      keywords: keywordsInput.value,
      commentTemplate: commentTemplate,
    });

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      // Check if we're on a TikTok page
      if (!tab.url.includes("tiktok.com")) {
        statusDiv.textContent = "Please navigate to TikTok first";
        return;
      }

      // Inject the content script if it hasn't been injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, {
        action: "startSearch",
        keywords: keywords,
        commentTemplate: commentTemplate,
      });

      statusDiv.textContent = "Search started...";
    } catch (error) {
      statusDiv.textContent = "Error: " + error.message;
      console.error(error);
    }
  });

  stopButton.addEventListener("click", async function () {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.tabs.sendMessage(tab.id, {
        action: "stopSearch",
      });
      statusDiv.textContent = "Search stopped.";
    } catch (error) {
      statusDiv.textContent = "Error: " + error.message;
      console.error(error);
    }
  });
});
