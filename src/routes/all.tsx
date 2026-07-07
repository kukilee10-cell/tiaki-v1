import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { useTiakiItems } from "@/hooks/use-tiaki";
import { CATEGORIES, statusForDate } from "@/lib/tiaki-storage";

export const Route = createFileRoute("/all")({
  component: AllCategories,
});

function AllCategories() {
  const items = useTiakiItems();

  const stats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catItems = items.filter((i) => i.categoryId === cat.id);
      const worst = catItems.reduce<"attention" | "soon" | "good">((acc, i) => {
        const s = statusForDate(i.dueDate);
        if (s === "attention") return "attention";
        if (s === "soon" && acc !== "attention") return "soon";
        return acc;
      }, "good");
      return { ...cat, count: catItems.length, worst };
    });
  }, [items]);

  return (
    <div className="min-h-screen bg-sand-50 pb-32 text-leaf-900">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-leaf-800/60">
          Everything you care for
        </p>
        <h1 className="font-display text-5xl italic leading-none">
          Your life,
          <br />
          <span className="text-leaf-800/40">in one place.</span>
        </h1>
      </header>

      <section className="animate-reveal px-6 [animation-delay:100ms]">
        <ul className="space-y-3">
          {stats.map((cat) => {
            const Icon = CATEGORY_ICON[cat.id];
            const dot =
              cat.worst === "attention"
                ? "bg-clay"
                : cat.worst === "soon"
                  ? "bg-sea-500"
                  : "bg-leaf-800/15";
            return (
              <li key={cat.id}>
                <Link
                  to="/category/$categoryId"
                  params={{ categoryId: cat.id }}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-leaf-900/5 bg-white p-5 transition-all hover:-translate-y-0.5"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand-100">
                      <Icon
                        className="size-4 text-leaf-800/60"
                        strokeWidth={1.5}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl leading-tight">
                        {cat.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
                        {cat.count === 0
                          ? "Empty"
                          : `${cat.count} ${cat.count === 1 ? "item" : "items"}`}
                      </p>
                    </div>
                  </div>
                  <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <BottomNav />
    </div>
  );
}
