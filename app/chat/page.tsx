"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function ChatLanding() {
  const params = useSearchParams();
  const apiKey = params.get("key");
  const productId = params.get("product");
  const businessName = params.get("name") || undefined;

  useEffect(() => {
    if (!apiKey) return;

    const script = document.createElement("script");
    script.src = `${window.location.origin}/widget.js`;
    script.setAttribute("data-api-key", apiKey);
    script.setAttribute("data-api-url", process.env.NEXT_PUBLIC_API_URL || "");
    if (businessName) {
      script.setAttribute("data-business-name", businessName);
    }
    if (productId) {
      // widget.js already auto-opens on its own when a product is set.
      script.setAttribute("data-product-id", productId);
    }
    script.defer = true;
    document.body.appendChild(script);

    // No product set - this page exists purely to open the chat, so open
    // it automatically anyway, by finding the widget's own bubble once
    // it's ready and clicking it. This never touches widget.js itself,
    // so every other embedding (a business's own website) is unaffected.
    if (!productId) {
      const observer = new MutationObserver(() => {
        const host = document.getElementById("datacrux-amara-widget");
        const bubble = host?.shadowRoot?.querySelector(".bubble") as HTMLElement | null;
        if (bubble) {
          bubble.click();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, [apiKey, productId, businessName]);

  if (!apiKey) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          color: "#5b6472",
          background: "#eef2fb",
          padding: "24px",
          textAlign: "center",
        }}
      >
        This link is missing its API key.
      </div>
    );
  }

  // A plain, calm background while the widget loads and opens itself -
  // there's nothing else on this page by design.
  return <div style={{ minHeight: "100vh", background: "#eef2fb" }} />;
}

export default function ChatLandingPage() {
  // useSearchParams requires a Suspense boundary in the App Router -
  // without this wrapper, Next.js fails the build.
  return (
    <Suspense fallback={null}>
      <ChatLanding />
    </Suspense>
  );
}
