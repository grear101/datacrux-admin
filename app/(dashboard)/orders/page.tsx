"use client";

import { useEffect, useState } from "react";
import { getOrders, Order, ApiError } from "@/lib/api";
import { NodeLoader } from "@/components/NodeLoader";

function formatNaira(value: string) {
  return "₦" + Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "text-green-500 border-green-500/30 bg-green-500/10",
  pending: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  cancelled: "text-red-500 border-red-500/30 bg-red-500/10",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load orders."));
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Orders</h1>
      <p className="text-slate-400 text-sm mt-1 mb-8">
        Every order AMARA has confirmed, most recent first.
      </p>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {orders === null && !error && <NodeLoader label="Loading orders…" />}

      {orders?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-navy-700 rounded-xl">
          <p className="text-slate-400 text-sm">
            No orders yet. Once AMARA confirms a sale, it&apos;ll show up here.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((order) => {
          const statusStyle = STATUS_STYLES[order.status] || "text-slate-400 border-navy-700 bg-navy-700/30";
          const hasService = order.items.some((i) => i.product.isService);

          return (
            <div key={order.id} className="rounded-xl border border-navy-700 bg-navy-800 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="diamond-bullet" />
                    <p className="font-medium">{order.customerName || "Unknown customer"}</p>
                    <span
                      className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  {order.customerPhone && (
                    <p className="text-slate-400 text-sm font-mono mt-1">{order.customerPhone}</p>
                  )}
                </div>
                <p className="text-slate-500 text-xs shrink-0">{formatDate(order.createdAt)}</p>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-slate-300 font-mono">
                    {item.quantity}x {item.product.name} @ {formatNaira(item.negotiatedPrice)}
                    {Number(item.negotiatedPrice) < Number(item.listPrice) && (
                      <span className="text-slate-500"> (list {formatNaira(item.listPrice)})</span>
                    )}
                  </p>
                ))}
              </div>

              {order.deliveryAddress && (
                <p className="text-sm text-slate-400 mb-3">
                  <span className="text-slate-500">{hasService ? "When/where: " : "Deliver to: "}</span>
                  {order.deliveryAddress}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-navy-700">
                <div className="text-xs text-slate-500">
                  Subtotal {formatNaira(order.subtotal)}
                  {Number(order.discountTotal) > 0 && (
                    <span> · Discount {formatNaira(order.discountTotal)}</span>
                  )}
                </div>
                <p className="font-mono font-medium">{formatNaira(order.finalAmount)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
