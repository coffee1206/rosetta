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
  const textNodes = []; // selectorsで指定したセレクターのエレメントとテキストをここに格納
  const selectors = ["h1", "h2", "h3", "p", "li"];
  const splittedNodes = [];
  const promises = [];

  // 連想配列としてelementとtextContentを格納
  selectors.forEach((selector) => {
    let index = 0;
    document.querySelectorAll(selector).forEach((element) => {
      let textNode = {
        element: element,
        elementIndex: index++,
        textContent: element.textContent,
      };
      textNodes.push(textNode);
    });
  });

  console.log(textNodes);

  // テキストノードを分割して翻訳に投げる
  const textCount = 0;
  textNodes.forEach((textNode) => {
    textCount += textNode.textContent.length;
    splittedNodes.push(textNode);
    if (textCount > 1000) {
      translateTextNodes(splittedNodes);
      // 初期化
      textCount = 0;
      translateTextNodes.length = 0;
    }
  });
}

// 翻訳結果を要素に置換
function replaceContent(textNodes) {
  textNodes.forEach((textNode) => {
    textNode.element.textContent = textNode.textContent;
  });
}

// テキストノードの翻訳
function translateTextNodes(textNodes) {
  sendAndReceiveTranslateData(textNodes)
    .then((response) => {
      const translatedTextNodes = JSON.parse(response.translatedText);
      console.log(translatedTextNodes);
      console.log("input_tokens:" + response.input_tokens);
      console.log("output_tokens:" + response.output_tokens);
      replaceContent(translatedTextNodes);
    })
    .catch((error) => {
      console.error(error);
    });
}

// 翻訳APIへのリクエストの送受信
async function sendAndReceiveTranslateData(text) {
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
