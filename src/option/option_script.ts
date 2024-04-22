document.addEventListener("DOMContentLoaded", function () {
  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save-btn");

  saveButton.addEventListener("click", function () {
    const apiKey = apiKeyInput.value.trim();
    chrome.storage.sync.set({ apiKey: apiKey }, function () {
      console.log("saved!");
    });
  });
});
