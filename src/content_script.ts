interface TextNode {
  selector: string;
  elementIndex: number;
  textContent: string;
};

interface TranslateResponse {
  translatedTextNodes: TextNode[];
  input_tokens: number;
  output_tokens: number;
};

declare namespace globalVariable {
  let allNodes: NodeListOf<Element> | null;
  let promises: Promise<void>[];
  let allInputTokens: number;
  let allOutputTokens: number;
}

window.allNodes = document.querySelectorAll('someSelector'); // 例えば、特定の要素を取得
window.promises = [];
window.allInputTokens = 0;
window.allOutputTokens = 0;

document.addEventListener("DOMContentLoaded", (_event: Event): void => {

  // 翻訳するボタンをクリックしたときの処理
  const button = document.getElementById("exec-translate");
  button?.addEventListener("click", (): void => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs): void => {
      if (!tabs.length || tabs[0].id === undefined) {
        return;
      }
    
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id},
        func: exec,
      });
    });
  });
});

// 実行
// 各要素を取得、翻訳して置換する
function exec(): void {
  console.time("execTime");
  allNodes = document.querySelectorAll("body *:not(header):not(footer):not(header *):not(footer *)"); // DOMの揺らぎに対応するため、一度全てのノードを取得
  const textNodes: TextNode[] = []; // selectorsで指定したセレクターのエレメントとテキストをここに格納
  const selectors = ["h1", "h2", "h3", "p", "li"];
  const splittedNodes: TextNode[] = [];

  // 連想配列としてelementとtextContentを格納
  selectors.forEach((selector) => {
    let index = 0;
    document.querySelectorAll(selector + ":not(header):not(footer):not(header *):not(footer *)").forEach((element) => {
      const textNode: TextNode = {
        selector: selector,
        elementIndex: index++,
        textContent: element.textContent?.trim() || "",
      };
      textNodes.push(textNode);
    });
  });

  // 翻訳APIへのリクエストの送受信
async function sendAndReceiveTranslateData(text:TextNode[]): Promise<TranslateResponse> {
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
  
// テキストノードの翻訳
function translateTextNodes(textNodes: TextNode[]): void {
  const promise = sendAndReceiveTranslateData(textNodes)
    .then((response: TranslateResponse) => {
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

  // テキストノードを分割して翻訳に投げる
  let textCount: number = 0;
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
function replaceContent(textNodes: TextNode[]): void {
  console.log("textNodes:");
  console.log(textNodes);
  textNodes.forEach((textNode) => {
    let convertedTypeArrayAllNodes: Element[] = Array.from(allNodes as NodeListOf<Element>);
    let targetElement = convertedTypeArrayAllNodes.filter((element) => element.localName === textNode.selector);
    targetElement[textNode.elementIndex].textContent = textNode.textContent;
  });
}