import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Screen, SectionTitle } from "@/components/rotation/Chrome";
import { Field, Modal, SubmitBar } from "@/components/rotation/Actions";
import { useInbound, useProducts } from "@/hooks/use-stock";
import {
  deleteInbound,
  INBOUND_STATUS_LABEL,
  newInbound,
  receiveDelivery,
  saveInbound,
  type InboundLine,
  type InboundOrder,
  type InboundStatus,
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
        content:
          "Purchase orders in transit and goods-in receipting for the warehouse.",
      },
    ],
  }),
  component: InboundPage,
});

const inputCls =
  "w-full panel-recessed px-3 py-2.5 font-mono text-[13px] text-foreground outline-none focus:border-hivis";

const STATUSES: InboundStatus[] = [
  "ordered",
  "shipped",
  "in_transit",
  "partial",
  "received",
];

function InboundPage() {
  const orders = useInbound();
  const products = useProducts();
  const [receiving, setReceiving] = useState<InboundOrder | null>(null);
  const [editing, setEditing] = useState<InboundOrder | "new" | null>(null);
  const [qtys, setQtys] = useState<Record<string, string>>({});

  const nameFor = (id: string) =>
    products.find((p) => p.id === id)?.name ?? "UNKNOWN LINE";
  const skuFor = (id: string) => products.find((p) => p.id === id)?.sku ?? "—";

  return (
    <Screen sub="Inbound Deliveries">
      <SectionTitle
        right={
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-hivis"
          >
            <Plus className="size-3.5" strokeWidth={2.4} />
            New
          </button>
        }
      >
        Purchase Orders
      </SectionTitle>

      {orders.length === 0 ? (
        <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
          NOTHING ON ORDER. TAP NEW TO TRACK A DELIVERY.
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
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => setEditing(o)}
                      aria-label={`Edit ${o.ref}`}
                      className="grid size-8 place-items-center border border-steel-700 text-steel-400 active:text-hivis"
                    >
                      <Pencil className="size-3.5" strokeWidth={2} />
                    </button>
                    {open && (
                      <button
                        onClick={() => {
                          setReceiving(o);
                          setQtys({});
                        }}
                        className="rounded-[3px] bg-hivis px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary-foreground active:opacity-80"
                      >
                        Receive
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 divide-y divide-steel-700 border-t border-steel-700">
                  {o.lines.map((l) => (
                    <div
                      key={l.productId}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px]">
                          {nameFor(l.productId)}
                        </p>
                        <p className="label-industrial mt-0.5">
                          {skuFor(l.productId)}
                        </p>
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
        open={!!receiving}
        title={`Receive ${receiving?.ref ?? ""}`}
        onClose={() => setReceiving(null)}
      >
        {receiving && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const map: Record<string, number> = {};
              for (const l of receiving.lines)
                map[l.productId] = Number(qtys[l.productId]) || 0;
              receiveDelivery(receiving.id, map);
              setReceiving(null);
            }}
            className="space-y-3"
          >
            {receiving.lines.map((l) => (
              <Field
                key={l.productId}
                label={`${skuFor(l.productId)} — OUTSTANDING ${Math.max(
                  0,
                  l.qtyOrdered - l.qtyReceived,
                )}`}
              >
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={qtys[l.productId] ?? ""}
                  onChange={(e) =>
                    setQtys((prev) => ({
                      ...prev,
                      [l.productId]: e.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </Field>
            ))}
            <SubmitBar label="Book Into Stock" />
          </form>
        )}
      </Modal>

      <Modal
        open={!!editing}
        title={editing === "new" ? "New Order" : "Edit Order"}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <OrderForm
            order={editing === "new" ? null : editing}
            onDone={() => setEditing(null)}
          />
        )}
      </Modal>
    </Screen>
  );
}

function OrderForm({
  order,
  onDone,
}: {
  order: InboundOrder | null;
  onDone: () => void;
}) {
  const products = useProducts();
  const [ref, setRef] = useState(order?.ref ?? "");
  const [supplier, setSupplier] = useState(order?.supplier ?? "");
  const [eta, setEta] = useState(order?.eta ?? "");
  const [status, setStatus] = useState<InboundStatus>(order?.status ?? "ordered");
  const [lines, setLines] = useState<InboundLine[]>(
    order?.lines ?? (products[0] ? [{ productId: products[0].id, qtyOrdered: 1, qtyReceived: 0 }] : []),
  );

  if (products.length === 0) {
    return (
      <p className="font-mono text-[11px] text-steel-400">
        NO PRODUCTS ON FILE — ADD A PRODUCT FIRST.
      </p>
    );
  }

  const setLine = (i: number, patch: Partial<InboundLine>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const payload = {
          ref: ref.toUpperCase() || "PO-NEW",
          supplier: supplier || "UNNAMED SUPPLIER",
          eta: eta || undefined,
          status,
          lines: lines.filter((l) => l.qtyOrdered > 0),
        };
        if (order) saveInbound({ ...order, ...payload });
        else newInbound(payload);
        onDone();
      }}
      className="space-y-3"
    >
      <Field label="Order ref">
        <input
          className={inputCls}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="PO-1064"
        />
      </Field>
      <Field label="Supplier">
        <input
          className={inputCls}
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Northline Supply Co."
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="ETA">
          <input
            className={inputCls}
            type="date"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
          />
        </Field>
        <Field label="Status">
          <select
            className={inputCls}
            value={status}
            onChange={(e) => setStatus(e.target.value as InboundStatus)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {INBOUND_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="space-y-2 border-t border-steel-700 pt-3">
        <p className="label-industrial">Lines</p>
        {lines.map((l, i) => (
          <div key={i} className="flex items-center gap-2">
            <select
              className={inputCls}
              value={l.productId}
              onChange={(e) => setLine(i, { productId: e.target.value })}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name}
                </option>
              ))}
            </select>
            <input
              className="w-20 panel-recessed px-2 py-2.5 text-center font-mono text-[13px] outline-none focus:border-hivis"
              type="number"
              min="0"
              value={l.qtyOrdered}
              onChange={(e) =>
                setLine(i, { qtyOrdered: Number(e.target.value) || 0 })
              }
            />
            <button
              type="button"
              aria-label="Remove line"
              onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
              className="grid size-9 shrink-0 place-items-center border border-steel-700 text-steel-400 active:text-hivis"
            >
              <Trash2 className="size-3.5" strokeWidth={2} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setLines((prev) => [
              ...prev,
              { productId: products[0].id, qtyOrdered: 1, qtyReceived: 0 },
            ])
          }
          className="flex w-full items-center justify-center gap-1.5 border border-dashed border-steel-700 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-steel-400 active:text-hivis"
        >
          <Plus className="size-3.5" strokeWidth={2.4} />
          Add line
        </button>
      </div>

      <SubmitBar label={order ? "Save Order" : "Create Order"} />

      {order && (
        <button
          type="button"
          onClick={() => {
            deleteInbound(order.id);
            onDone();
          }}
          className="mt-2 w-full py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-steel-400 active:text-[var(--crit)]"
        >
          Delete order
        </button>
      )}
    </form>
  );
}
