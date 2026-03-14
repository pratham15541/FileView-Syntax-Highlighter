// FileView Background Service Worker

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/onboarding/onboarding.html"),
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_EXTENSION_URL") {
    sendResponse({ url: chrome.runtime.getURL(message.path) });
    return true;
  }

  if (message.type === "OPEN_ONBOARDING") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/onboarding/onboarding.html"),
    });
    return true;
  }

  // ── Storage proxy for MAIN-world content scripts ─────────────────────────
  // chrome.storage is NOT available in world:MAIN content scripts.
  // These handlers let the content script read/write storage via the background.
  // ─────────────────────────────────────────────────────────────────────────
  if (message.type === "STORAGE_GET") {
    chrome.storage.local.get(message.keys, (result) => {
      sendResponse({ result });
    });
    return true;
  }

  if (message.type === "STORAGE_SET") {
    chrome.storage.local.set(message.data, () => {
      sendResponse({ ok: true });
    });
    return true;
  }

  // ── Streaming Chat Proxy ─────────────────────────────────────────────────
  // User provides: baseUrl, apiKey, model, messages
  // We stream SSE chunks back to the content script via repeated sendMessage
  // calls (one per token), then a final { done: true } message.
  // ─────────────────────────────────────────────────────────────────────────
  if (message.type === "CHATBOT_API_REQUEST") {
    const { baseUrl, apiKey, model, messages } = message;
    const tabId = sender && sender.tab && sender.tab.id;

    // Use exactly what the user provides — no defaults, no mutations
    const endpoint = baseUrl.replace(/\/$/, "") + "/chat/completions";

    fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
      }),
    })
      .then(async (response) => {
        // Non-OK response — read body as text and send error back
        if (!response.ok) {
          const errText = await response.text().catch(() => "");
          let errMsg = `HTTP ${response.status}`;
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson?.error?.message || errJson?.error || errMsg;
          } catch (_) {}
          chrome.tabs.sendMessage(tabId, {
            type: "CHATBOT_STREAM_ERROR",
            error: errMsg,
          });
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process all complete lines in buffer
            while (true) {
              const lineEnd = buffer.indexOf("\n");
              if (lineEnd === -1) break;

              const line = buffer.slice(0, lineEnd).trim();
              buffer = buffer.slice(lineEnd + 1);

              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              if (data === "[DONE]") {
                chrome.tabs.sendMessage(tabId, { type: "CHATBOT_STREAM_DONE" });
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  chrome.tabs.sendMessage(tabId, {
                    type: "CHATBOT_STREAM_CHUNK",
                    content: content,
                  });
                }
              } catch (_) {
                // Ignore malformed JSON chunks
              }
            }
          }
        } finally {
          reader.cancel().catch(() => {});
        }

        // Stream ended without [DONE] — still signal completion
        chrome.tabs.sendMessage(tabId, { type: "CHATBOT_STREAM_DONE" });
      })
      .catch((err) => {
        chrome.tabs.sendMessage(tabId, {
          type: "CHATBOT_STREAM_ERROR",
          error: `Network error: ${err.message}`,
        });
      });

    // Return true to keep message channel open
    return true;
  }

  // Add handler for listing all storage keys
  if (message.type === 'STORAGE_GET_ALL_KEYS') {
    chrome.storage.local.get(null, (items) => {
      sendResponse({ keys: Object.keys(items) });
    });
    return true;
  }

  return true;
});
