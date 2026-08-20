import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, SectionTitle } from "@/components/rotation/Chrome";
import { Field, Modal, SubmitBar } from "@/components/rotation/Actions";
import { useInbound, useProducts } from "@/hooks/use-stock";
import {
  INBOUND_STATUS_LABEL,
  receiveDelivery,
  type InboundOrder,
} from "@/lib/stock-storage";

export const Route = createFileRoute("/inbound")({
  head: () => ({
    meta: [
      { title: "Inbound Deliveries — Rotation Co." },
      {
        name: "description",
        content:
          "Track purchase orders and inbound deliveries, then book received quantities straight into stock.",
      },
      { property: "og:title", content: "Inbound Deliveries — Rotation Co." },
      {
        property: "og:description",
        content: "Purchase orders in transit and goods-in receipting for the warehouse.",
      },
    ],
  }),
  component: InboundPage,
});

function InboundPage() {
  const orders = useInbound();
  const products = useProducts();
  const [active, setActive] = useState<InboundOrder | null>(null);
  const [qtys, setQtys] = useState<Record<string, string>>({});

  const nameFor = (id: string) => products.find((p) => p.id === id)?.name ?? "UNKNOWN LINE";
  const skuFor = (id: string) => products.find((p) => p.id === id)?.sku ?? "—";

  return (
    <Screen sub="Inbound Deliveries">
      <SectionTitle>Purchase Orders</SectionTitle>
      {orders.length === 0 ? (
        <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
          NO INBOUND ORDERS ON FILE.
        </p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const open = o.status !== "received";
            return (
              <div key={o.id} className="panel-raised px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[13px] tracking-[0.06em] text-hivis">
                      {o.ref}
                    </p>
                    <p className="mt-0.5 text-[13px]">{o.supplier}</p>
                    <p className="label-industrial mt-1">
                      {INBOUND_STATUS_LABEL[o.status]}
                      {o.eta ? ` · ETA ${o.eta}` : ""}
                    </p>
                  </div>
                  {open && (
                    <button
                      onClick={() => {
                        setActive(o);
                        setQtys({});
                      }}
                      className="shrink-0 rounded-[3px] bg-hivis px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary-foreground active:opacity-80"
                    >
                      Receive
                    </button>
                  )}
                </div>
                <div className="mt-2 divide-y divide-steel-700 border-t border-steel-700">
                  {o.lines.map((l) => (
                    <div
                      key={l.productId}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px]">{nameFor(l.productId)}</p>
                        <p className="label-industrial mt-0.5">{skuFor(l.productId)}</p>
                      </div>
                      <p className="font-mono text-[12px] text-steel-400">
                        {l.qtyReceived}/{l.qtyOrdered}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!active}
        title={`Receive ${active?.ref ?? ""}`}
        onClose={() => setActive(null)}
      >
        {active && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const map: Record<string, number> = {};
              for (const l of active.lines) map[l.productId] = Number(qtys[l.productId]) || 0;
              receiveDelivery(active.id, map);
              setActive(null);
            }}
            className="space-y-3"
          >
            {active.lines.map((l) => (
              <Field
                key={l.productId}
                label={`${skuFor(l.productId)} — OUTSTANDING ${Math.max(
                  0,
                  l.qtyOrdered - l.qtyReceived,
                )}`}
              >
                <input
                  className="w-full panel-recessed px-3 py-2.5 font-mono text-[13px] outline-none focus:border-hivis"
                  type="number"
                  min="0"
                  value={qtys[l.productId] ?? ""}
                  onChange={(e) =>
                    setQtys((prev) => ({ ...prev, [l.productId]: e.target.value }))
                  }
                  placeholder="0"
                />
              </Field>
            ))}
            <SubmitBar label="Book Into Stock" />
          </form>
        )}
      </Modal>
    </Screen>
  );
}
