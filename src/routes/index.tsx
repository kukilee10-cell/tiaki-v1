import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Screen, SectionTitle, Stat, StatusTag } from "@/components/rotation/Chrome";
import { ItemForm, Modal } from "@/components/rotation/Actions";
import { useProducts } from "@/hooks/use-stock";
import { money, totals } from "@/lib/stock-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stock Dashboard — Rotation Co. Warehouse & Inventory" },
      {
        name: "description",
        content:
          "Warehouse stock dashboard: total products, units on hand, stock value, potential sales and profit, plus low-stock alerts.",
      },
      { property: "og:title", content: "Rotation Co. Warehouse & Inventory" },
      {
        property: "og:description",
        content:
          "Simple industrial stock control: landed cost, profit and live inventory in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const products = useProducts();
  const t = totals(products);
  const [q, setQ] = useState("");
  const [add, setAdd] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const match = (p: (typeof products)[number]) =>
      !term ||
      [p.name, p.sku, p.category, p.supplier, p.destination, p.location]
        .join(" ")
        .toLowerCase()
        .includes(term);
    return products.filter(match).sort((a, b) => a.name.localeCompare(b.name));
  }, [products, q]);

  return (
    <Screen sub="Warehouse & Inventory">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Total products" value={String(t.products)} />
        <Stat label="Total units" value={String(t.units)} />
        <Stat label="Stock value" value={money(t.value)} accent="hivis" />
        <Stat label="Low stock" value={String(t.low)} accent={t.low ? "warn" : "default"} />
        <Stat label="Potential sales" value={money(t.sales)} />
        <Stat label="Potential profit" value={money(t.profit)} accent="hivis" />
      </div>

      <button
        onClick={() => setAdd(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[3px] bg-hivis px-4 py-4 font-mono text-[12px] uppercase tracking-[0.16em] text-primary-foreground active:opacity-80"
      >
        <Plus className="size-4" strokeWidth={2.4} /> Add Item
      </button>

      <div className="panel-recessed mt-3 flex items-center gap-2 px-3 py-3">
        <Search className="size-4 text-steel-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH NAME, SKU, SUPPLIER…"
          className="w-full bg-transparent font-mono text-[11px] uppercase tracking-[0.08em] outline-none placeholder:text-steel-400"
        />
      </div>

      <div className="mt-5">
        <SectionTitle
          right={
            <span className="font-mono text-[10px] tracking-[0.12em] text-steel-400">
              {rows.length} LINES
            </span>
          }
        >
          Inventory
        </SectionTitle>
        {rows.length === 0 ? (
          <p className="panel px-3 py-5 font-mono text-[11px] text-steel-400">
            {products.length === 0 ? "NO STOCK ON FILE — TAP ADD ITEM." : "NO MATCHING LINES."}
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
                  {p.destination && <span>TO {p.destination}</span>}
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
