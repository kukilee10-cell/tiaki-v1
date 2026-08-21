import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Screen, StatusTag } from "@/components/rotation/Chrome";
import { ItemForm, Modal } from "@/components/rotation/Actions";
import { useProducts } from "@/hooks/use-stock";
import { money, statusFor } from "@/lib/stock-storage";

export const Route = createFileRoute("/stock/")({
  head: () => ({
    meta: [
      { title: "Stock Register — Rotation Co." },
      {
        name: "description",
        content:
          "Search the full stock register by product, SKU, category, supplier, destination or storage location.",
      },
      { property: "og:title", content: "Stock Register — Rotation Co." },
      {
        property: "og:description",
        content: "Every line item on file with quantities, locations and landed cost.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StockList,
});

function StockList() {
  const products = useProducts();
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);
  const [add, setAdd] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => {
        if (lowOnly && statusFor(p) === "in_stock") return false;
        return (
          !term ||
          [p.name, p.sku, p.category, p.supplier, p.destination, p.location]
            .join(" ")
            .toLowerCase()
            .includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, q, lowOnly]);

  return (
    <Screen sub="Stock Register">
      <div className="panel-recessed flex items-center gap-2 px-3 py-3">
        <Search className="size-4 text-steel-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH"
          className="w-full bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] outline-none placeholder:text-steel-400"
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        <button
          onClick={() => setLowOnly((v) => !v)}
          className="rounded-[2px] border px-2.5 py-2 font-mono text-[10px] tracking-[0.12em]"
          style={{
            borderColor: lowOnly ? "var(--hivis)" : "var(--steel-700)",
            color: lowOnly ? "var(--hivis)" : "var(--steel-400)",
            background: lowOnly ? "var(--hivis-dim)" : "transparent",
          }}
        >
          NEEDS ATTENTION
        </button>
        <span className="font-mono text-[10px] tracking-[0.12em] text-steel-400">
          {rows.length} LINES
        </span>
      </div>

      <button
        onClick={() => setAdd(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] bg-hivis px-4 py-4 font-mono text-[12px] uppercase tracking-[0.16em] text-primary-foreground active:opacity-80"
      >
        <Plus className="size-4" strokeWidth={2.4} /> Add Item
      </button>

      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="panel px-3 py-5 font-mono text-[11px] text-steel-400">
            NO MATCHING LINES.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((p) => (
              <Link
                key={p.id}
                to="/stock/$productId"
                params={{ productId: p.id }}
                className="panel block px-3 py-3 active:bg-steel-800"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{p.name}</p>
                    <p className="label-industrial mt-1">
                      {p.sku} · {p.category || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num-xl text-[26px] leading-none">{p.qty}</p>
                    <div className="mt-1.5">
                      <StatusTag product={p} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-steel-700 pt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-steel-400">
                  {p.location && <span>LOC {p.location}</span>}
                  {p.supplier && <span>FROM {p.supplier}</span>}
                  <span>LANDED {money(p.landedUnit)}</span>
                  {p.sellPrice > 0 && <span>SELL {money(p.sellPrice)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Modal open={add} title="Add Item" onClose={() => setAdd(false)}>
        <ItemForm onDone={() => setAdd(false)} />
      </Modal>
    </Screen>
  );
}
