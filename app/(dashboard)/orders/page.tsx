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

function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "text-green-700 border-green-200 bg-green-50",
  pending: "text-amber-700 border-amber-200 bg-amber-50",
  cancelled: "text-red-700 border-red-200 bg-red-50",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setOrders(null);
    setError(null);
    getOrders({ startDate: startDate || undefined, endDate: endDate || undefined })
      .then(setOrders)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load orders."));
  }, [startDate, endDate]);

  const hasFilter = !!startDate || !!endDate;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink-900">Orders</h1>
      <p className="text-ink-500 text-sm mt-1 mb-6">
        Every order AMARA has confirmed, most recent first.
      </p>

      <div className="flex flex-wrap items-end gap-3 mb-6 rounded-xl border border-card-border bg-card shadow-sm p-4">
        <div>
          <label className="block text-xs text-ink-400 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-surface-50 border border-card-border rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-400 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-surface-50 border border-card-border rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:border-blue-400"
          />
        </div>
        {hasFilter && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm text-ink-500 hover:text-ink-900 px-3 py-2"
          >
            Clear
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {orders === null && !error && <NodeLoader label="Loading orders…" />}

      {orders?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-card-border rounded-xl">
          <p className="text-ink-500 text-sm">
            {hasFilter
              ? "No orders in that date range."
              : "No orders yet. Once AMARA confirms a sale, it'll show up here."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {orders?.map((order) => {
          const statusStyle = STATUS_STYLES[order.status] || "text-ink-500 border-card-border bg-surface-50";
          const hasService = order.items.some((i) => i.product.isService);

          return (
            <div key={order.id} className="rounded-xl border border-card-border bg-card shadow-sm p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="diamond-bullet" />
                    <p className="font-medium text-ink-900">{order.customerName || "Unknown customer"}</p>
                    <span
                      className={`text-[11px] uppercase tracking-wide border rounded px-1.5 py-0.5 ${statusStyle}`}
                    >
                      {order.status}
                    </span>
                    {hasService && order.scheduledAt && (
                      <span className="text-[11px] uppercase tracking-wide text-blue-700 border border-blue-200 bg-blue-50 rounded px-1.5 py-0.5">
                        Booked
                      </span>
                    )}
                  </div>
                  {order.customerPhone && (
                    <p className="text-ink-500 text-sm font-mono mt-1">{order.customerPhone}</p>
                  )}
                </div>
                <p className="text-ink-400 text-xs shrink-0">{formatDate(order.createdAt)}</p>
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item) => (
                  <p key={item.id} className="text-sm text-ink-500 font-mono">
                    {item.quantity}x {item.product.name} @ {formatNaira(item.negotiatedPrice)}
                    {Number(item.negotiatedPrice) < Number(item.listPrice) && (
                      <span className="text-ink-400"> (list {formatNaira(item.listPrice)})</span>
                    )}
                  </p>
                ))}
              </div>

              {hasService && order.scheduledAt && (
                <p className="text-sm font-medium text-blue-700 mb-3">
                  Scheduled: {formatScheduled(order.scheduledAt)}
                </p>
              )}

              {order.deliveryAddress && (
                <p className="text-sm text-ink-500 mb-3">
                  <span className="text-ink-400">{hasService ? "Location: " : "Deliver to: "}</span>
                  {order.deliveryAddress}
                </p>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-card-border">
                <div className="text-xs text-ink-400">
                  Subtotal {formatNaira(order.subtotal)}
                  {Number(order.discountTotal) > 0 && (
                    <span> · Discount {formatNaira(order.discountTotal)}</span>
                  )}
                </div>
                <p className="font-mono font-medium text-ink-900">{formatNaira(order.finalAmount)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
