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
  const allNodes = Array.from(
    document.querySelectorAll(
      "body *:not(script):not(script *):not(code):not(code *):not(style):not(style *):not(link):not(meta):not(noscript):not(iframe):not(object):not(embed)"
    )
  )
    .map((el) => Array.from(el.childNodes).filter((el) => el instanceof Text))
    .flat();
  const textNodes = [];
  const rawTextArray = [];
  const promises = [];

  allNodes.forEach((element) => {
    const textNodeContent = element.textContent.trim();
    if (textNodeContent !== "") {
      textNodes.push(element);
      rawTextArray.push(textNodeContent);
    }
  });

  // console.log(rawTextArray);
  const promise = translate(rawTextArray)
    .then((response) => {
      //TODO テキストノードベースに変更したがここでコケてる　あとで直す
      const translatedArray = JSON.parse(response.translatedText);
      console.log("input_tokens:" + response.input_tokens);
      console.log("output_tokens:" + response.output_tokens);
      console.log(translatedArray);
      replaceContent(textNodes, translatedArray);
      console.timeLog("exec_time");
    })
    .catch((error) => {
      element.textContent = error;
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
