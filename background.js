// オプションからAPIキーを取得する
function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("apiKey", function (result) {
      if (result.apiKey) {
        resolve(result.apiKey);
      } else {
        reject('APIキーが見つかりません。');
      }
    });
  });
}

// 取得した行列を翻訳する
async function translateArray(Array) {
  const apiKey = await getApiKey();
  const stringifyArray = JSON.stringify(Array);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "あなたは優秀な翻訳家です。以下の配列の要素を日本語に翻訳して置き換えてください。",
        },
        { role: "user", content: stringifyArray},
      ],
      max_tokens: 4096,
      temperature: 0.9,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Error: ${errorData.error.message}`);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const translatedArray = data.choices[0].message.content.trim();
  const tokens = data.usage.total_tokens;
  return { translatedText: translatedArray, tokens: tokens };
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
