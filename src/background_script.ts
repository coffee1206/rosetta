interface TextNode {
  selector: string;
  elementIndex: number;
  textContent: string;
};

interface TranslateResponse {
  translatedTextNodes: TextNode[];
  input_tokens: number;
  output_tokens: number;
}

// オプションからAPIキーを取得する
function getApiKey(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get("apiKey", (result: { apiKey?: string }) => {
      if (result.apiKey) {
        resolve(result.apiKey);
      } else {
        reject("APIキーが見つかりません。");
      }
    });
  });
}

// 連想配列からテキストコンテンツを抽出し、LLMが読める形に変換する
function extractTextContent(nodes: TextNode[]) {
  const textContentsWithTokenArray = nodes.map((node: TextNode) => `[START]${node.textContent}[END]`);
  const textContentsWithTokenString = textContentsWithTokenArray.join("");
  return textContentsWithTokenString;
}

// 連想配列内のテキストコンテンツを更新する
function updateTextContent(nodes: TextNode[], translatedTextContents: string) {
  const tokenRegex = RegExp("\\[START\\]([\\s\\S]*?)\\[END\\]", "g");
  const removeTokenArray: string[] = [];
  let matchText;

  while ((matchText = tokenRegex.exec(translatedTextContents)) !== null) {
    removeTokenArray.push(matchText[1]);
  }

  nodes.forEach((node, index) => {
    node.textContent = removeTokenArray[index];
  });
  return nodes;
}

// 取得した配列を翻訳する
async function translateNodes(nodes: TextNode[]) {
  const apiKey = await getApiKey();
  const textContents = extractTextContent(nodes);
  const response = await fetch("https://api.cohere.ai/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "command-r-plus",
      chat_history: [
        {
          role: "USER",
          message:
          "あなたは優秀な翻訳家です。ユーザーから文字列が提供されます。[START]から[END]毎に文、または単語の翻訳を行い、中身を置換してください。[START]と[END]を勝手に消さないでください。固有名詞と思われる単語は翻訳しないでください。",
        },
        {
          role: "CHATBOT",
          message: "はい、私は優秀な翻訳家です。以下が回答になります。",
        },
      ],
      message: textContents,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error(`Error: ${errorData.error.message}`);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  const translatedTextContents = data.text.trim();
  const input_tokens = data.meta.tokens.input_tokens;
  const output_tokens = data.meta.tokens.output_tokens;

  const translatedTextNodes = updateTextContent(nodes, translatedTextContents);

  return {
    translatedTextNodes: translatedTextNodes,
    input_tokens: input_tokens,
    output_tokens: output_tokens,
  };
}

// content.jsからのリクエストを受け取って、関数実行後に返す
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "translate") {
    translateNodes(request.text)
      .then((content) => {
        sendResponse({ success: true, content: content });
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  return;
});