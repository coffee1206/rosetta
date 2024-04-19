let allNodes = null;
let promises = [];
let allInputTokens = 0;
let allOutputTokens = 0;

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
  console.time("execTime");
  allNodes = document.querySelectorAll("body *:not(header):not(footer):not(header *):not(footer *)"); // DOMの揺らぎに対応するため、一度全てのノードを取得
  const textNodes = []; // selectorsで指定したセレクターのエレメントとテキストをここに格納
  const selectors = ["h1", "h2", "h3", "p", "li"];
  const splittedNodes = [];

  // 連想配列としてelementとtextContentを格納
  selectors.forEach((selector) => {
    let index = 0;
    document.querySelectorAll(selector + ":not(header):not(footer):not(header *):not(footer *)").forEach((element) => {
      let textNode = {
        selector: selector,
        elementIndex: index++,
        textContent: element.textContent.trim(),
      };
      textNodes.push(textNode);
    });
  });

  // テキストノードを分割して翻訳に投げる
  let textCount = 0;
  textNodes.forEach((textNode) => {
    textCount += textNode.textContent.length;
    splittedNodes.push(textNode);
    if (textCount > 1500) {
      translateTextNodes(splittedNodes);
      // 初期化
      textCount = 0;
      splittedNodes.length = 0;
    }
  });

  Promise.all(promises).then(() => {
    console.log("allInputTokens: " + allInputTokens);
    console.log("allOutputTokens: " + allOutputTokens);
    console.timeEnd("execTime");
  });
}
// 翻訳結果を要素に置換
function replaceContent(textNodes) {
  console.log("textNodes:");
  console.log(textNodes);
  textNodes.forEach((textNode) => {
    convertedTypeArrayAllNodes = [].map.call(allNodes, (element) => {
      return element;
    });
    let targetElement = convertedTypeArrayAllNodes.filter(function (element) {
      return element.localName === textNode.selector;
    });
    targetElement[textNode.elementIndex].textContent = textNode.textContent;
  });
}

// テキストノードの翻訳
function translateTextNodes(textNodes) {
  const promise = sendAndReceiveTranslateData(textNodes)
    .then((response) => {
      const translatedTextNodes = response.translatedTextNodes;
      allInputTokens += response.input_tokens;
      allOutputTokens += response.output_tokens;
      replaceContent(translatedTextNodes);
    })
    .catch((error) => {
      console.error(error);
    });

    promises.push(promise);
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
