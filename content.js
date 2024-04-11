document.addEventListener("DOMContentLoaded", function (event) {
  // 翻訳するボタンをクリックしたときの処理
  document
    .getElementById("exec-translate")
    .addEventListener("click", function () {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tab) {
        chrome.scripting.executeScript({
          target: { tabId: tab[0].id },
          function: function () {
            exec();
          },
        });
      });
    });
});

// 実行
// 各要素を取得、翻訳して置換する
function exec() {
  console.time("exec_time");
  const selectors = ["h1", "h2", "h3", "p", "li"];
  const rawArray = [];
  const promises = [];

  selectors.forEach((selector) => {
    rawArray.length = 0;
    document.querySelectorAll(selector).forEach((element) => {
      rawArray.push(element.textContent);
    });
    const promise = translate(rawArray)
      .then((translation) => {
        const translatedArray = JSON.parse(translation.translatedText);
        console.log("selector:" + selector);
        console.log("input_tokens:" + translation.input_tokens);
        console.log("output_tokens:" + translation.output_tokens);
        console.log(translatedArray);
        replaceContent(selector, translatedArray);
        console.timeLog("exec_time");
      })
      .catch((error) => {
        element.textContent = error;
      });
    promises.push(promise);
  });
  Promise.all(promises).then(() => {
    console.timeEnd("execTime");
  });
}

// 翻訳結果を要素に置換
function replaceContent(selector, translatedArray) {
  document.querySelectorAll(selector).forEach((element, index) => {
    if (index < translatedArray.length) {
      element.textContent = translatedArray[index];
    }
  });
}

// 翻訳APIへのリクエストの送受信
async function translate(text) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { type: "translate", text: text },
      (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError.message);
          return;
        }
        if (response.success) {
          resolve(response.content);
        } else {
          reject(response.error);
        }
      }
    );
  });
}
