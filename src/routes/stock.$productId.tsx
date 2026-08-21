import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Minus, Plus, Trash2 } from "lucide-react";
import { Screen, SectionTitle, StatusTag } from "@/components/rotation/Chrome";
import { Chips, Field, Modal, SubmitBar, inputCls } from "@/components/rotation/Actions";
import { useMovements, useProducts } from "@/hooks/use-stock";
import {
  deleteProduct,
  knownDestinations,
  knownSuppliers,
  money,
  potentialProfit,
  potentialSales,
  profitPerItem,
  stockIn,
  stockOut,
  stockValue,
  today,
  type Product,
} from "@/lib/stock-storage";

export const Route = createFileRoute("/stock/$productId")({
  head: () => ({
    meta: [
      { title: "Product Record — Rotation Co. Stock" },
      {
        name: "description",
        content:
          "Product record: quantity, landed cost, profit, stock value and full movement history.",
      },
      { property: "og:title", content: "Product Record — Rotation Co. Stock" },
      {
        property: "og:description",
        content: "Landed cost, profit and movement history for this line item.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductRecord,
});

function ProductRecord() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const product = useProducts().find((p) => p.id === productId);
  const moves = useMovements()
    .filter((m) => m.productId === productId)
    .slice()
    .reverse();
  const [sheet, setSheet] = useState<"in" | "out" | null>(null);

  if (!product) {
    return (
      <Screen sub="Product Record">
        <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
          RECORD NOT FOUND.
        </p>
        <Link to="/stock" className="mt-3 inline-block font-mono text-[11px] text-hivis">
          ← STOCK REGISTER
        </Link>
      </Screen>
    );
  }

  return (
    <Screen sub="Product Record">
      <Link
        to="/stock"
        className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-steel-400"
      >
        <ArrowLeft className="size-3.5" /> STOCK REGISTER
      </Link>

      <div className="panel-raised hivis-edge px-3 py-3">
        <p className="label-industrial">{product.sku}</p>
        <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.04em]">
          {product.name}
        </h2>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="num-xl text-[38px] leading-none text-hivis">{product.qty}</p>
            <p className="label-industrial mt-1">Units in stock</p>
          </div>
          <StatusTag product={product} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setSheet("in")}
          className="flex items-center justify-center gap-2 rounded-[3px] bg-hivis px-3 py-4 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground active:opacity-80"
        >
          <Plus className="size-4" strokeWidth={2.4} /> Stock In
        </button>
        <button
          onClick={() => setSheet("out")}
          className="flex items-center justify-center gap-2 rounded-[3px] border border-steel-700 px-3 py-4 font-mono text-[11px] uppercase tracking-[0.14em] active:bg-steel-800"
        >
          <Minus className="size-4" strokeWidth={2.4} /> Stock Out
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Spec label="Category" value={product.category || "—"} />
        <Spec label="Storage location" value={product.location || "—"} />
        <Spec label="Supplier" value={product.supplier || "—"} />
        <Spec label="Destination" value={product.destination || "—"} />
        <Spec label="Landed cost / item" value={money(product.landedUnit)} accent />
        <Spec
          label="Selling price"
          value={product.sellPrice > 0 ? money(product.sellPrice) : "—"}
        />
        <Spec
          label="Profit / item"
          value={product.sellPrice > 0 ? money(profitPerItem(product)) : "—"}
        />
        <Spec label="Stock value" value={money(stockValue(product))} accent />
        <Spec
          label="Potential sales"
          value={product.sellPrice > 0 ? money(potentialSales(product)) : "—"}
        />
        <Spec
          label="Potential profit"
          value={product.sellPrice > 0 ? money(potentialProfit(product)) : "—"}
        />
        <Spec label="Low stock level" value={product.lowLevel ? String(product.lowLevel) : "—"} />
        <Spec label="First received" value={product.receivedAt} />
        <Spec label="Last updated" value={product.updatedAt.slice(0, 16).replace("T", " ")} />
      </div>

      {product.notes && (
        <div className="panel mt-2 px-3 py-3">
          <p className="label-industrial">Notes</p>
          <p className="mt-1 text-[13px] text-foreground">{product.notes}</p>
        </div>
      )}

      <div className="mt-5">
        <SectionTitle>Movement History</SectionTitle>
        {moves.length === 0 ? (
          <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
            NO MOVEMENTS LOGGED.
          </p>
        ) : (
          <div className="panel divide-y divide-steel-700">
            {moves.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] tracking-[0.1em]">
                    {m.ref} · {m.dir === "in" ? "STOCK IN" : "STOCK OUT"}
                  </p>
                  <p className="label-industrial mt-0.5">
                    {m.date}
                    {m.party ? ` · ${m.party}` : ""}
                    {m.reason ? ` · ${m.reason}` : ""}
                  </p>
                  {m.notes && (
                    <p className="mt-1 text-[12px] text-steel-400">{m.notes}</p>
                  )}
                </div>
                <span
                  className="num-xl text-[18px]"
                  style={{ color: m.dir === "in" ? "var(--ok)" : "var(--crit)" }}
                >
                  {m.dir === "in" ? `+${m.qty}` : `-${m.qty}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => {
          deleteProduct(product.id);
          navigate({ to: "/stock" });
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-[3px] border border-steel-700 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-steel-400 active:bg-steel-800"
      >
        <Trash2 className="size-3.5" /> Delete Product
      </button>

      <Modal
        open={sheet === "in"}
        title="Stock In"
        onClose={() => setSheet(null)}
      >
        <StockInForm product={product} onDone={() => setSheet(null)} />
      </Modal>
      <Modal
        open={sheet === "out"}
        title="Stock Out"
        onClose={() => setSheet(null)}
      >
        <StockOutForm product={product} onDone={() => setSheet(null)} />
      </Modal>
    </Screen>
  );
}

function StockInForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(today());
  const [party, setParty] = useState(product.supplier);
  const [cost, setCost] = useState("");
  const [freight, setFreight] = useState("");
  const [notes, setNotes] = useState("");
  const [suppliers, setSuppliers] = useState<string[]>([]);
  useEffect(() => setSuppliers(knownSuppliers()), []);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(qty) || 0;
        if (n <= 0) return;
        stockIn(product.id, {
          qty: n,
          date,
          party: party.trim(),
          productCost: Number(cost) || 0,
          freightCost: Number(freight) || 0,
          notes: notes.trim() || undefined,
        });
        onDone();
      }}
      className="space-y-3.5"
    >
      <Field label="Quantity in">
        <input
          className={inputCls}
          type="number"
          inputMode="numeric"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Date">
        <input
          className={inputCls}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="Source / supplier">
        <input className={inputCls} value={party} onChange={(e) => setParty(e.target.value)} />
      </Field>
      <Chips options={suppliers} onPick={setParty} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Product cost">
          <input
            className={inputCls}
            type="number"
            step="0.01"
            inputMode="decimal"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </Field>
        <Field label="Freight cost">
          <input
            className={inputCls}
            type="number"
            step="0.01"
            inputMode="decimal"
            value={freight}
            onChange={(e) => setFreight(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Note (optional)">
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <SubmitBar label="Add Stock" />
    </form>
  );
}

function StockOutForm({ product, onDone }: { product: Product; onDone: () => void }) {
  const [qty, setQty] = useState("");
  const [date, setDate] = useState(today());
  const [party, setParty] = useState(product.destination);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [dests, setDests] = useState<string[]>([]);
  useEffect(() => setDests(knownDestinations()), []);
  const n = Number(qty) || 0;
  const over = n > product.qty;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (n <= 0) return;
        if (over && !confirm(`Only ${product.qty} in stock. Take stock to 0?`)) return;
        stockOut(product.id, {
          qty: n,
          date,
          party: party.trim(),
          reason: reason.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        onDone();
      }}
      className="space-y-3.5"
    >
      <Field label={`Quantity out (${product.qty} available)`}>
        <input
          className={inputCls}
          type="number"
          inputMode="numeric"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          autoFocus
        />
      </Field>
      {over && (
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-crit">
          Warning — more than current stock. Stock will be set to 0.
        </p>
      )}
      <Field label="Date">
        <input
          className={inputCls}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="Destination">
        <input className={inputCls} value={party} onChange={(e) => setParty(e.target.value)} />
      </Field>
      <Chips options={dests} onPick={setParty} />
      <Field label="Reason (optional)">
        <input className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <Field label="Note (optional)">
        <input className={inputCls} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <SubmitBar label="Remove Stock" />
    </form>
  );
}

function Spec({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="panel px-3 py-2.5">
      <p className="label-industrial">{label}</p>
      <p
        className="mt-1 font-mono text-[14px]"
        style={accent ? { color: "var(--hivis)" } : undefined}
      >
        {value}
      </p>
    </div>
  );
}
