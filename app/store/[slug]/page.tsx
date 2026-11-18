"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  imageUrls: string[];
  isService: boolean;
}

interface StorefrontData {
  businessName: string;
  tagline: string | null;
  logoUrl: string | null;
  accentColor: string | null;
  apiKey: string;
  trackingSnippets: string[];
  products: StorefrontProduct[];
}

function formatNaira(value: number) {
  return "₦" + value.toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

/**
 * Raw third-party embed HTML, inserted via .innerHTML, never actually
 * executes any <script> tag inside it - that's a universal browser
 * behavior, not specific to this page. This re-creates each <script>
 * found so the browser treats it as newly inserted and actually runs
 * it - the standard technique for injecting real third-party pixels.
 */
function injectTrackingSnippets(snippets: string[]) {
  const container = document.createElement("div");
  container.style.display = "none";
  document.body.appendChild(container);
  container.innerHTML = snippets.join("\n");

  const inertScripts = Array.from(container.querySelectorAll("script"));
  for (const inert of inertScripts) {
    const live = document.createElement("script");
    for (const attr of Array.from(inert.attributes)) {
      live.setAttribute(attr.name, attr.value);
    }
    live.text = inert.textContent || "";
    document.head.appendChild(live);
  }
}

export default function StorefrontPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [data, setData] = useState<StorefrontData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const trackingInjected = useRef(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/storefront/public/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setData(json);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  useEffect(() => {
    if (data && data.trackingSnippets.length > 0 && !trackingInjected.current) {
      trackingInjected.current = true;
      injectTrackingSnippets(data.trackingSnippets);
    }
  }, [data]);

  function orderLink(productId: string) {
    const dashboardHost =
      typeof window !== "undefined" ? window.location.hostname.replace(/^store\./, "") : "";
    return `https://${dashboardHost}/chat?key=${data?.apiKey}&product=${productId}`;
  }

  if (notFound) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#6b7280" }}>
        This storefront isn&apos;t available.
      </div>
    );
  }

  if (!data) {
    return <div style={{ minHeight: "100vh", background: "#fafafa" }} />;
  }

  const accent = data.accentColor || "#2F6FED";

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header style={{ padding: "40px 20px 28px", textAlign: "center", background: "#ffffff", borderBottom: "1px solid #eee" }}>
        {data.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.logoUrl}
            alt=""
            style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", margin: "0 auto 14px" }}
          />
        )}
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", margin: 0 }}>{data.businessName}</h1>
        {data.tagline && <p style={{ color: "#6b7280", fontSize: 14, marginTop: 6 }}>{data.tagline}</p>}
      </header>

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "28px 16px 60px" }}>
        {data.products.length === 0 ? (
          <p style={{ textAlign: "center", color: "#9ca3af", padding: "60px 0" }}>No products available right now.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
            {data.products.map((p) => (
              <div
                key={p.id}
                style={{ background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden", display: "flex", flexDirection: "column" }}
              >
                <div style={{ aspectRatio: "1 / 1", background: "#f3f4f6" }}>
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
                <div style={{ padding: 14, display: "flex", flexDirection: "column", flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: 15, color: "#111827", margin: "0 0 4px" }}>{p.name}</p>
                  {p.description && (
                    <p style={{ fontSize: 13, color: "#6b7280", margin: "0 0 10px", flex: 1 }}>{p.description}</p>
                  )}
                  <p style={{ fontWeight: 700, fontSize: 16, color: "#111827", margin: "0 0 12px" }}>{formatNaira(p.price)}</p>
                  <a
                    href={orderLink(p.id)}
                    style={{
                      display: "block",
                      textAlign: "center",
                      background: accent,
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: 14,
                      padding: "10px 0",
                      borderRadius: 8,
                      textDecoration: "none",
                    }}
                  >
                    Order Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "20px 0 40px", color: "#9ca3af", fontSize: 12 }}>
        Powered by Datacrux Africa Ltd
      </footer>
    </div>
  );
}
