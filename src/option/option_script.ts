document.addEventListener("DOMContentLoaded", function () {
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const saveButton = document.getElementById("save-btn") as HTMLElement;

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      if (apiKeyInput) {
        const apiKey = apiKeyInput.value.trim();
        chrome.storage.sync.set({ apiKey: apiKey }, function () {
          console.log("saved!");
        });
      } else {
        console.error("apiKeyInputが見つかりません。");
      }
    });
  } else {
    console.error("saveButtonが見つかりません。");
  }
});