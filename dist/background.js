"use strict";
function getApiKey() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("apiKey", function (result) {
            if (result.apiKey) {
                resolve(result.apiKey);
            }
            else {
                reject("APIキーが見つかりません。");
            }
        });
    });
}
function extractTextContent(nodes) {
    const textContentsWithTokenArray = nodes.map(node => `[START]${node.textContent}[END]`);
    const textContentsWithTokenString = textContentsWithTokenArray.join("");
    return textContentsWithTokenString;
}
function updateTextContent(nodes, translatedTextContents) {
    const tokenRegex = RegExp("\\[START\\]([\\s\\S]*?)\\[END\\]", "g");
    const removeTokenArray = [];
    let matchText;
    while ((matchText = tokenRegex.exec(translatedTextContents)) !== null) {
        removeTokenArray.push(matchText[1]);
    }
    nodes.forEach((node, index) => {
        node.textContent = removeTokenArray[index];
    });
    return nodes;
}
async function translateNodes(nodes) {
    const apiKey = await getApiKey();
    const textContents = extractTextContent(nodes);
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
                    message: "あなたは優秀な翻訳家です。ユーザーから文字列が提供されます。[START]から[END]毎に文、または単語の翻訳を行い、中身を置換してください。[START]と[END]を勝手に消さないでください。固有名詞と思われる単語は翻訳しないでください。",
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
});
