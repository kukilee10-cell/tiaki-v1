import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Screen, StatusTag } from "@/components/rotation/Chrome";
import { useProducts } from "@/hooks/use-stock";
import { statusFor } from "@/lib/stock-storage";

export const Route = createFileRoute("/stock/")({
  head: () => ({
    meta: [
      { title: "Stock Register — Rotation Co." },
      {
        name: "description",
        content:
          "Full stock register: SKUs, bin locations, on-hand quantities and stock value for Rotation Co.",
      },
      { property: "og:title", content: "Stock Register — Rotation Co." },
      {
        property: "og:description",
        content: "Every line item on file with quantities, bins and stock value.",
      },
    ],
  }),
  component: StockList,
});

function StockList() {
  const products = useProducts();
  const [q, setQ] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return products
      .filter((p) => {
        if (lowOnly && statusFor(p) === "in_stock") return false;
        return (
          !term ||
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          (p.bin ?? "").toLowerCase().includes(term)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, q, lowOnly]);

  return (
    <Screen sub="Stock Register">
      <div className="panel-recessed flex items-center gap-2 px-3 py-2.5">
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
          className="rounded-[2px] border px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em]"
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

      <div className="mt-4">
        {rows.length === 0 ? (
          <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
            NO MATCHING LINES.
          </p>
        ) : (
          <div className="panel divide-y divide-steel-700">
            {rows.map((p) => (
              <Link
                key={p.id}
                to="/stock/$productId"
                params={{ productId: p.id }}
                className="flex items-center gap-3 px-3 py-3 active:bg-steel-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{p.name}</p>
                  <p className="label-industrial mt-1">{p.sku}</p>
                </div>
                {statusFor(p) !== "in_stock" && <StatusTag product={p} />}
                <p className="num-xl w-12 text-right text-[24px] leading-none">
                  {p.onHand}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Screen>
  );
}

