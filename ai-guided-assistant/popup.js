document.getElementById("startBtn").addEventListener("click", async () => {
  const goal = document.getElementById("goalInput").value;

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  chrome.tabs.sendMessage(
    tab.id,
    {
      type: "USER_GOAL",
      goal
    },
    () => {
      if (chrome.runtime.lastError) {
        console.log(
          "No content script in this tab:",
          chrome.runtime.lastError.message
        );
      }
    }
  );
});
