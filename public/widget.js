/**
 * Datacrux AMARA Chat Widget - WhatsApp-style
 *
 * Embed with:
 * <script src="https://datacrux-admin.vercel.app/widget.js"
 *         data-api-key="YOUR_API_KEY"
 *         data-api-url="https://datacrux-backend-production.up.railway.app"
 *         data-business-name="Demo Business"
 *         data-product-id="optional-product-id-for-ad-deep-linking"
 *         defer></script>
 *
 * If data-product-id is set, the chat opens automatically on page load,
 * with no click required - this matches how WhatsApp's own "click to chat"
 * ad links behave, since that's the traffic this is built for.
 */
(function () {
  var scriptTag = document.currentScript;
  var apiKey = scriptTag.getAttribute("data-api-key");
  var apiUrl = scriptTag.getAttribute("data-api-url");
  var productId = scriptTag.getAttribute("data-product-id") || null;
  var businessName = scriptTag.getAttribute("data-business-name") || "Chat with us";
  var avatarUrl = scriptTag.getAttribute("data-avatar-url") ||
    new URL(scriptTag.src).origin + "/logo.png";

  if (!apiKey || !apiUrl) {
    console.error("[Datacrux AMARA widget] Missing data-api-key or data-api-url on the script tag.");
    return;
  }

  var storageKey = "datacrux_conv_" + apiKey.slice(-8);

  var host = document.createElement("div");
  host.id = "datacrux-amara-widget";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }

    .bubble {
      position: fixed; bottom: 20px; right: 20px; width: 58px; height: 58px;
      border-radius: 50%; background: #25D366; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3); z-index: 999999; border: none;
      transition: transform 0.15s ease;
    }
    .bubble:hover { transform: scale(1.06); }
    .bubble svg { width: 30px; height: 30px; }
    .bubble.hidden { display: none; }

    .panel {
      position: fixed; bottom: 92px; right: 20px; width: 370px; max-width: calc(100vw - 24px);
      height: 560px; max-height: calc(100vh - 120px);
      background: #E5DDD5; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.35);
      display: none; flex-direction: column; overflow: hidden; z-index: 999999;
    }
    .panel.open { display: flex; }

    /* Mobile: fill the whole screen, like the WhatsApp app itself */
    @media (max-width: 480px) {
      .panel {
        bottom: 0; right: 0; left: 0; top: 0;
        width: 100%; height: 100%; max-width: 100%; max-height: 100%;
        border-radius: 0;
      }
      .bubble { bottom: 16px; right: 16px; }
    }

    .header {
      background: #075E54; color: white; padding: 10px 14px;
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .header .back {
      background: none; border: none; color: white; cursor: pointer;
      padding: 4px; display: none; align-items: center; justify-content: center;
    }
    @media (max-width: 480px) {
      .header .back { display: flex; }
    }
    .header .avatar {
      width: 38px; height: 38px; border-radius: 50%; object-fit: cover;
      background: white; flex-shrink: 0;
    }
    .header .info { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
    .header .name { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .header .status { font-size: 12px; color: #d9fdd3; opacity: 0.85; }
    .header .close {
      margin-left: auto; background: none; border: none; color: white; opacity: 0.9;
      cursor: pointer; padding: 4px; display: flex; align-items: center;
    }
    @media (max-width: 480px) {
      .header .close { display: none; }
    }

    .messages {
      flex: 1; overflow-y: auto; padding: 14px 10px;
      display: flex; flex-direction: column; gap: 2px;
      background-color: #E5DDD5;
      background-image: radial-gradient(#d8cfc4 0.5px, transparent 0.5px);
      background-size: 16px 16px;
    }
    .msg-row { display: flex; margin: 3px 0; }
    .msg-row.user { justify-content: flex-end; }
    .msg-row.amara { justify-content: flex-start; }

    .msg {
      max-width: 78%; padding: 7px 9px 8px; font-size: 14px; line-height: 1.4;
      box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
      position: relative;
    }
    .msg.user {
      background: #D9FDD3; color: #111b21;
      border-radius: 8px 8px 2px 8px;
    }
    .msg.amara {
      background: #FFFFFF; color: #111b21;
      border-radius: 8px 8px 8px 2px;
    }
    .msg .text { white-space: pre-wrap; word-wrap: break-word; }
    .msg .time {
      display: block; font-size: 10.5px; color: rgba(0,0,0,0.45);
      text-align: right; margin-top: 2px; margin-left: 8px; float: right;
    }

    .msg-row.loading .msg {
      background: #FFFFFF; padding: 10px 14px;
      border-radius: 8px 8px 8px 2px;
    }
    .typing-dot {
      display: inline-block; width: 6px; height: 6px; border-radius: 50%;
      background: #9aa3a7; margin-right: 4px; animation: blink 1.2s infinite;
    }
    .typing-dot:last-child { margin-right: 0; }
    .typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .typing-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

    .input-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; background: #F0F0F0; flex-shrink: 0;
    }
    .input-bar input {
      flex: 1; background: white; border: none; border-radius: 22px;
      padding: 10px 16px; font-size: 14.5px; color: #111b21; outline: none;
    }
    .input-bar input::placeholder { color: #8696a0; }
    .send-btn {
      width: 40px; height: 40px; border-radius: 50%; background: #00A884;
      border: none; color: white; display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
    }
    .send-btn:disabled { opacity: 0.5; cursor: default; }
    .send-btn svg { width: 19px; height: 19px; }
  `;
  root.appendChild(style);

  var bubble = document.createElement("button");
  bubble.className = "bubble";
  bubble.setAttribute("aria-label", "Chat with us");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">' +
    '<path d="M12 2C6.48 2 2 6.03 2 11c0 2.42 1.06 4.61 2.8 6.24L4 22l5.05-1.65C10 20.77 10.98 21 12 21c5.52 0 10-4.03 10-9s-4.48-10-10-10z"/>' +
    "</svg>";

  var panel = document.createElement("div");
  panel.className = "panel";
  panel.innerHTML =
    '<div class="header">' +
    '<button class="back" aria-label="Close">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>' +
    "</button>" +
    '<img class="avatar" src="' + avatarUrl + '" alt="" onerror="this.style.visibility=\'hidden\'" />' +
    '<div class="info"><span class="name">' + businessName + "</span>" +
    '<span class="status">online</span></div>' +
    '<button class="close" aria-label="Close chat">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    "</button>" +
    "</div>" +
    '<div class="messages"></div>' +
    '<div class="input-bar">' +
    '<input type="text" placeholder="Type a message" />' +
    '<button class="send-btn" aria-label="Send">' +
    '<svg viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
    "</button>" +
    "</div>";

  root.appendChild(panel);
  root.appendChild(bubble);

  var messagesEl = panel.querySelector(".messages");
  var inputEl = panel.querySelector("input");
  var sendBtn = panel.querySelector(".send-btn");
  var closeBtn = panel.querySelector(".close");
  var backBtn = panel.querySelector(".back");

  var conversationId = sessionStorage.getItem(storageKey) || null;
  var isFirstMessage = !conversationId;

  function openPanel() {
    panel.classList.add("open");
    bubble.classList.add("hidden");
    inputEl.focus();
  }
  function closePanel() {
    panel.classList.remove("open");
    bubble.classList.remove("hidden");
  }

  bubble.addEventListener("click", openPanel);
  closeBtn.addEventListener("click", closePanel);
  backBtn.addEventListener("click", closePanel);

  function timeNow() {
    var d = new Date();
    var h = d.getHours();
    var m = d.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return h + ":" + (m < 10 ? "0" + m : m) + " " + ampm;
  }

  function addMessage(text, who) {
    var row = document.createElement("div");
    row.className = "msg-row " + who;
    var bubbleEl = document.createElement("div");
    bubbleEl.className = "msg " + who;
    var textEl = document.createElement("span");
    textEl.className = "text";
    textEl.textContent = text;
    var timeEl = document.createElement("span");
    timeEl.className = "time";
    timeEl.textContent = timeNow();
    bubbleEl.appendChild(textEl);
    bubbleEl.appendChild(timeEl);
    row.appendChild(bubbleEl);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  }

  function addLoading() {
    var row = document.createElement("div");
    row.className = "msg-row amara loading";
    row.innerHTML =
      '<div class="msg amara"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  }

  async function sendMessage(text) {
    addMessage(text, "user");
    var loadingRow = addLoading();
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
      loadingRow.remove();

      if (!res.ok) {
        addMessage("Sorry, something went wrong. Please try again in a moment.", "amara");
        return;
      }

      conversationId = data.conversationId;
      sessionStorage.setItem(storageKey, conversationId);
      isFirstMessage = false;
      addMessage(data.reply, "amara");
    } catch (err) {
      loadingRow.remove();
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

  // Ad-originated traffic: open immediately, no click needed - this mirrors
  // how WhatsApp's own "click to chat" ad links land a customer straight
  // into a conversation rather than a landing page they have to act on again.
  if (productId) {
    openPanel();
  }
})();
