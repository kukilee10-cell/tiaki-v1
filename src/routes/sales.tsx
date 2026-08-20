import { createFileRoute } from "@tanstack/react-router";
import { Screen, SectionTitle, Stat } from "@/components/rotation/Chrome";
import { useMovements, useProducts } from "@/hooks/use-stock";
import { money } from "@/lib/stock-storage";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales & Outgoing — Rotation Co." },
      {
        name: "description",
        content:
          "Outgoing stock log: units sold, sales revenue, samples issued and invoice references.",
      },
      { property: "og:title", content: "Sales & Outgoing — Rotation Co." },
      {
        property: "og:description",
        content: "Every sale and sample issued out of the Rotation Co. warehouse.",
      },
    ],
  }),
  component: SalesPage,
});

function SalesPage() {
  const products = useProducts();
  const moves = useMovements()
    .filter((m) => m.type === "sold" || m.type === "sample")
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  const find = (id: string) => products.find((p) => p.id === id);
  const unitsOut = moves.reduce((s, m) => s + Math.abs(m.qty), 0);
  const revenue = moves
    .filter((m) => m.type === "sold")
    .reduce((s, m) => s + Math.abs(m.qty) * (find(m.productId)?.sellPrice ?? 0), 0);
  const samples = moves.filter((m) => m.type === "sample").reduce((s, m) => s + Math.abs(m.qty), 0);

  return (
    <Screen sub="Sales & Outgoing">
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Units out" value={String(unitsOut)} />
        <Stat label="Sales revenue" value={money(revenue)} accent="hivis" />
        <Stat label="Samples issued" value={String(samples)} />
        <Stat label="Transactions" value={String(moves.length)} />
      </div>

      <div className="mt-5">
        <SectionTitle>Outgoing Log</SectionTitle>
        {moves.length === 0 ? (
          <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
            NO SALES RECORDED.
          </p>
        ) : (
          <div className="panel divide-y divide-steel-700">
            {moves.map((m) => {
              const p = find(m.productId);
              const value = Math.abs(m.qty) * (p?.sellPrice ?? 0);
              return (
                <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px]">{p?.name ?? "UNKNOWN LINE"}</p>
                    <p className="label-industrial mt-0.5">
                      {m.at.slice(0, 10)} · {m.type === "sample" ? "SAMPLE" : "SALE"}
                      {m.ref ? ` · ${m.ref}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="num-xl text-[18px] leading-none">{Math.abs(m.qty)}</p>
                    <p className="label-industrial mt-1">
                      {m.type === "sample" ? "—" : money(value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Screen>
  );
}
