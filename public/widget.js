/**
 * Datacrux AMARA Chat Widget
 *
 * Embed with:
 * <script src="https://datacrux-admin.vercel.app/widget.js"
 *         data-api-key="YOUR_API_KEY"
 *         data-api-url="https://datacrux-backend-production.up.railway.app"
 *         data-product-id="optional-product-id-for-ad-deep-linking"
 *         data-color="#2F6FED"
 *         defer></script>
 */
(function () {
  var scriptTag = document.currentScript;
  var apiKey = scriptTag.getAttribute("data-api-key");
  var apiUrl = scriptTag.getAttribute("data-api-url");
  var productId = scriptTag.getAttribute("data-product-id") || null;
  var accentColor = scriptTag.getAttribute("data-color") || "#2F6FED";

  if (!apiKey || !apiUrl) {
    console.error("[Datacrux AMARA widget] Missing data-api-key or data-api-url on the script tag.");
    return;
  }

  var storageKey = "datacrux_conv_" + apiKey.slice(-8);

  // --- Host element + Shadow DOM, so the business's own site CSS can never
  // break the widget's layout, and the widget's CSS can never leak out. ---
  var host = document.createElement("div");
  host.id = "datacrux-amara-widget";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif; }
    .bubble {
      position: fixed; bottom: 24px; right: 24px; width: 60px; height: 60px;
      border-radius: 50%; background: ${accentColor}; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25); z-index: 999999; border: none;
      transition: transform 0.15s ease;
    }
    .bubble:hover { transform: scale(1.06); }
    .bubble svg { width: 26px; height: 26px; }
    .panel {
      position: fixed; bottom: 96px; right: 24px; width: 360px; max-width: calc(100vw - 32px);
      height: 480px; max-height: calc(100vh - 140px);
      background: #0b1220; border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.35);
      display: none; flex-direction: column; overflow: hidden; z-index: 999999;
      border: 1px solid #1b2740;
    }
    .panel.open { display: flex; }
    .header {
      background: ${accentColor}; color: white; padding: 14px 16px;
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .header .dot {
      width: 8px; height: 8px; background: white; opacity: 0.6;
      transform: rotate(45deg); flex-shrink: 0;
    }
    .header .title { font-weight: 600; font-size: 14px; }
    .header .close {
      margin-left: auto; background: none; border: none; color: white; opacity: 0.85;
      cursor: pointer; font-size: 18px; line-height: 1; padding: 4px;
    }
    .messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .msg { max-width: 82%; padding: 9px 12px; border-radius: 12px; font-size: 13.5px; line-height: 1.45; }
    .msg.user { align-self: flex-end; background: ${accentColor}; color: white; border-bottom-right-radius: 4px; }
    .msg.amara { align-self: flex-start; background: #1b2740; color: #f5f7fa; border-bottom-left-radius: 4px; }
    .msg.loading { align-self: flex-start; background: #1b2740; padding: 10px 14px; }
    .typing-dot {
      display: inline-block; width: 5px; height: 5px; border-radius: 50%;
      background: #8b96a8; margin-right: 3px; animation: blink 1.2s infinite;
    }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
    .input-row {
      display: flex; gap: 8px; padding: 12px; border-top: 1px solid #1b2740; flex-shrink: 0;
    }
    .input-row input {
      flex: 1; background: #121b2e; border: 1px solid #1b2740; border-radius: 10px;
      padding: 9px 12px; color: #f5f7fa; font-size: 13.5px; outline: none;
    }
    .input-row input:focus { border-color: ${accentColor}; }
    .input-row button {
      background: ${accentColor}; border: none; color: white; border-radius: 10px;
      padding: 0 16px; font-size: 13.5px; font-weight: 500; cursor: pointer;
    }
    .input-row button:disabled { opacity: 0.5; cursor: default; }
    .powered-by {
      text-align: center; font-size: 10px; color: #6b7690; padding: 6px 0 10px;
    }
  `;
  root.appendChild(style);

  // Bubble icon: simple chat glyph with a small diamond accent, echoing the brand mark
  var bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.setAttribute("aria-label", "Chat with us");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M4 4h16v12H8l-4 4V4z" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>' +
    "</svg>";

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<div class="header"><span class="dot"></span><span class="title">Chat with us</span>' +
    '<button class="close" aria-label="Close chat">×</button></div>' +
    '<div class="messages"></div>' +
    '<div class="input-row"><input type="text" placeholder="Type a message…" />' +
    '<button type="button">Send</button></div>' +
    '<div class="powered-by">Powered by Datacrux</div>';

  root.appendChild(panel);
  root.appendChild(bubble);

  var messagesEl = panel.querySelector(".messages");
  var inputEl = panel.querySelector("input");
  var sendBtn = panel.querySelector(".input-row button");
  var closeBtn = panel.querySelector(".close");

  var conversationId = sessionStorage.getItem(storageKey) || null;
  var isFirstMessage = !conversationId;

  bubble.addEventListener("click", function () {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) inputEl.focus();
  });
  closeBtn.addEventListener("click", function () {
    panel.classList.remove("open");
  });

  function addMessage(text, who) {
    var div = document.createElement("div");
    div.className = "msg " + who;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function addLoading() {
    var div = document.createElement("div");
    div.className = "msg loading";
    div.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  async function sendMessage(text) {
    addMessage(text, "user");
    var loadingEl = addLoading();
    sendBtn.disabled = true;

    var body = { message: text };
    if (conversationId) body.conversationId = conversationId;
    if (isFirstMessage && productId) body.productId = productId;

    try {
      var res = await fetch(apiUrl + "/conversation/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify(body),
      });
      var data = await res.json();
      loadingEl.remove();

      if (!res.ok) {
        addMessage("Sorry, something went wrong. Please try again in a moment.", "amara");
        return;
      }

      conversationId = data.conversationId;
      sessionStorage.setItem(storageKey, conversationId);
      isFirstMessage = false;
      addMessage(data.reply, "amara");
    } catch (err) {
      loadingEl.remove();
      addMessage("Sorry, I couldn't connect just now. Please try again.", "amara");
    } finally {
      sendBtn.disabled = false;
    }
  }

  sendBtn.addEventListener("click", function () {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    sendMessage(text);
  });

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      sendBtn.click();
    }
  });
})();
