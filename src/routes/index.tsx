import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ChevronRight, Truck } from "lucide-react";
import { Screen, SectionTitle, Stat, StatusTag } from "@/components/rotation/Chrome";
import { QuickActions } from "@/components/rotation/Actions";
import { useInbound, useProducts } from "@/hooks/use-stock";
import { INBOUND_STATUS_LABEL, money, statusFor, totals } from "@/lib/stock-storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rotation Co. Warehouse & Inventory" },
      {
        name: "description",
        content:
          "Operational stock dashboard for Rotation Co. — units on hand, stock value, low-stock alerts and inbound deliveries.",
      },
      { property: "og:title", content: "Rotation Co. Warehouse & Inventory" },
      {
        property: "og:description",
        content:
          "Industrial stock control terminal: units on hand, stock value, low stock and inbound deliveries.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const products = useProducts();
  const inbound = useInbound();
  const t = totals(products);
  const attention = products
    .filter((p) => statusFor(p) !== "in_stock")
    .sort((a, b) => a.onHand - b.onHand);
  const enRoute = inbound.filter((o) => o.status !== "received");

  return (
    <Screen sub="Warehouse & Inventory">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Stock value" value={money(t.value)} accent="hivis" />
        <Stat label="Low stock" value={String(t.low)} accent={t.low ? "warn" : "default"} />
      </div>

      <div className="mt-4">
        <QuickActions />
      </div>

      <div className="mt-6">
        <SectionTitle
          right={
            <Link to="/stock" className="font-mono text-[10px] tracking-[0.12em] text-hivis">
              ALL STOCK
            </Link>
          }
        >
          Needs Attention
        </SectionTitle>
        {attention.length === 0 ? (
          <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
            ALL LINES ABOVE REORDER POINT.
          </p>
        ) : (
          <div className="panel divide-y divide-steel-700">
            {attention.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/stock/$productId"
                params={{ productId: p.id }}
                className="flex items-center gap-3 px-3 py-3 active:bg-steel-800"
              >
                <AlertTriangle
                  className="size-4 shrink-0"
                  strokeWidth={2}
                  style={{ color: p.onHand <= 0 ? "var(--crit)" : "var(--warn)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{p.name}</p>
                  <p className="label-industrial mt-0.5">{p.sku}</p>
                </div>
                <p className="num-xl text-[22px] leading-none">{p.onHand}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {enRoute.length > 0 && (
        <div className="mt-6">
          <SectionTitle
            right={
              <Link to="/inbound" className="font-mono text-[10px] tracking-[0.12em] text-hivis">
                ALL INBOUND
              </Link>
            }
          >
            Arriving
          </SectionTitle>
          <div className="panel divide-y divide-steel-700">
            {enRoute.slice(0, 3).map((o) => (
              <Link
                key={o.id}
                to="/inbound"
                className="flex items-center gap-3 px-3 py-3 active:bg-steel-800"
              >
                <Truck className="size-4 shrink-0 text-hivis" strokeWidth={1.9} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12px] tracking-[0.06em]">{o.ref}</p>
                  <p className="label-industrial mt-0.5">{o.supplier}</p>
                </div>
                <ChevronRight className="size-4 text-steel-400" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </Screen>
  );
}

