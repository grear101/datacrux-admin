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
    // Explicit, not guessed - stripping "store." off the current host
    // would land on the marketing site's domain, not the dashboard's,
    // since they're separate projects under the same root domain.
    const dashboardHost = process.env.NEXT_PUBLIC_DASHBOARD_HOST;
    return `https://${dashboardHost}/chat?key=${data?.apiKey}&product=${productId}`;
  }

  if (notFound) {
    return <div className="sf-empty-state">This storefront isn&apos;t available.</div>;
  }

  if (!data) {
    return <div className="sf-loading" />;
  }

  const accent = data.accentColor || "#2F6FED";

  return (
    <div className="sf-page" style={{ ["--accent" as any]: accent }}>
      <style>{`
        .sf-empty-state, .sf-loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #6b7280;
          background: #fafafa;
          padding: 24px;
          text-align: center;
        }
        .sf-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #fafafa 0%, #f3f4f6 420px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .sf-header {
          padding: clamp(28px, 6vw, 48px) 20px clamp(24px, 5vw, 32px);
          text-align: center;
          background: #ffffff;
          border-bottom: 3px solid var(--accent);
          position: relative;
        }
        .sf-logo {
          width: clamp(56px, 12vw, 72px);
          height: clamp(56px, 12vw, 72px);
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 14px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border: 2px solid #fff;
        }
        .sf-name {
          font-size: clamp(20px, 5vw, 28px);
          font-weight: 800;
          color: #111827;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .sf-tagline {
          color: #6b7280;
          font-size: clamp(13px, 3vw, 15px);
          margin-top: 6px;
        }
        .sf-main {
          max-width: 1080px;
          margin: 0 auto;
          padding: clamp(20px, 4vw, 32px) 14px 60px;
        }
        .sf-empty {
          text-align: center;
          color: #9ca3af;
          padding: 60px 0;
        }
        .sf-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 560px) {
          .sf-grid { grid-template-columns: repeat(3, 1fr); gap: 18px; }
        }
        @media (min-width: 860px) {
          .sf-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .sf-card {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #eee;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .sf-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.08);
        }
        .sf-card-image {
          aspect-ratio: 1 / 1;
          background: #f3f4f6;
          position: relative;
          overflow: hidden;
        }
        .sf-card-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .sf-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--accent);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 3px 7px;
          border-radius: 999px;
        }
        .sf-card-body {
          padding: clamp(10px, 2.4vw, 16px);
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .sf-card-name {
          font-weight: 700;
          font-size: clamp(13px, 3vw, 15px);
          color: #111827;
          margin: 0 0 4px;
          line-height: 1.3;
        }
        .sf-card-desc {
          font-size: clamp(11.5px, 2.6vw, 13px);
          color: #6b7280;
          margin: 0 0 10px;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .sf-card-price {
          font-weight: 800;
          font-size: clamp(14px, 3.2vw, 17px);
          color: #111827;
          margin: 0 0 10px;
        }
        .sf-order-btn {
          display: block;
          text-align: center;
          background: var(--accent);
          color: #fff;
          font-weight: 700;
          font-size: clamp(12px, 2.8vw, 14px);
          padding: clamp(8px, 2vw, 11px) 0;
          border-radius: 9px;
          text-decoration: none;
          transition: filter 0.15s ease;
        }
        .sf-order-btn:hover { filter: brightness(1.1); }
        .sf-footer {
          text-align: center;
          padding: 24px 0 44px;
          color: #9ca3af;
          font-size: 12px;
        }
      `}</style>

      <header className="sf-header">
        {data.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logoUrl} alt="" className="sf-logo" />
        )}
        <h1 className="sf-name">{data.businessName}</h1>
        {data.tagline && <p className="sf-tagline">{data.tagline}</p>}
      </header>

      <main className="sf-main">
        {data.products.length === 0 ? (
          <p className="sf-empty">No products available right now.</p>
        ) : (
          <div className="sf-grid">
            {data.products.map((p) => (
              <div key={p.id} className="sf-card">
                <div className="sf-card-image">
                  {p.isService && <span className="sf-badge">Service</span>}
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} />
                  )}
                </div>
                <div className="sf-card-body">
                  <p className="sf-card-name">{p.name}</p>
                  {p.description && <p className="sf-card-desc">{p.description}</p>}
                  <p className="sf-card-price">{formatNaira(p.price)}</p>
                  <a href={orderLink(p.id)} className="sf-order-btn">
                    Order Now
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="sf-footer">Powered by Datacrux Africa Ltd</footer>
    </div>
  );
}
