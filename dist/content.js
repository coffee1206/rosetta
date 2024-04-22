"use strict";
let allNodes = null;
let promises = [];
let allInputTokens = 0;
let allOutputTokens = 0;
document.addEventListener("DOMContentLoaded", function (event) {
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
function exec() {
    console.time("execTime");
    allNodes = document.querySelectorAll("body *:not(header):not(footer):not(header *):not(footer *)");
    const textNodes = [];
    const selectors = ["h1", "h2", "h3", "p", "li"];
    const splittedNodes = [];
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
    let textCount = 0;
    textNodes.forEach((textNode) => {
        textCount += textNode.textContent.length;
        splittedNodes.push(textNode);
        if (textCount > 1500) {
            translateTextNodes(splittedNodes);
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
async function sendAndReceiveTranslateData(text) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: "translate", text: text }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
            }
            if (response.success) {
                resolve(response.content);
            }
            else {
                reject(response.error);
            }
        });
    });
}
