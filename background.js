// オプションからAPIキーを取得する
function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("apiKey", function (result) {
      if (result.apiKey) {
        resolve(result.apiKey);
      } else {
        reject("APIキーが見つかりません。");
      }
    });
  });
}

// 取得した行列を翻訳する
async function translateArray(Array) {
  const apiKey = await getApiKey();
  const stringifyArray = JSON.stringify(Array);

  const response = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "command-r",
      chat_history: [
        {
          role: "USER",
          message:
            "あなたは優秀な翻訳家です。ユーザーから提供される配列の要素を日本語に翻訳して、置換したあと配列のみを送信してください。ダブルクォーテーションは消さないでください。",
        },
        {
          role: "CHATBOT",
          message: "はい、私は優秀な翻訳家です。配列の提供を待機します。",
        },
      ],
      message: stringifyArray,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Error: ${errorData.error.message}`);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const translatedArray = data.text.trim();
  const input_tokens = data.meta.tokens.input_tokens;
  const output_tokens = data.meta.tokens.output_tokens;
  return {
    translatedText: translatedArray,
    input_tokens: input_tokens,
    output_tokens: output_tokens,
  };
}

// content.jsからのリクエストを受け取って、関数実行後に返す
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "translate") {
    translateArray(request.text)
      .then((content) => {
        sendResponse({ success: true, content: content });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
});
