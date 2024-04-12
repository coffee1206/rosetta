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
  //TODO ゴミみてえなDOMに対応する必要なし！！！！セレクターで取得するだけでヨシ！！！！リバート！！！！
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

  textNodes.forEach((textNode, index) => {
    let textCount = 0;
    textCount += textNode.textContent.length;
    splittedNodes.push(textNode);
    if (textCount > 1000) {
    }
  });
  const promise = translate(splittedNodes)
    .then((response) => {
      //TODO テキストノードベースに変更したがjson.parseでこけてる　あとで直す
      const translatedArray = response.translatedText;
      console.log(translatedArray);
      const jsonparse = JSON.parse(translatedArray);
      console.log("input_tokens:" + response.input_tokens);
      console.log("output_tokens:" + response.output_tokens);
      console.log(jsonparse);
      replaceContent(textNodes, translatedArray);
      console.timeLog("exec_time");
    })
    .catch((error) => {
      console.error(error);
    });
  promises.push(promise);
  Promise.all(promises).then(() => {
    console.timeEnd("execTime");
  });
}

// 翻訳結果を要素に置換
function replaceContent(textNodes, translatedArray) {
  textNodes.forEach((element, index) => {
    element.textContent = translatedArray[index];
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
