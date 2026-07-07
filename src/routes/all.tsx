import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
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

  const totalHeld = items.length;

  return (
    <div className="min-h-screen bg-vault pb-36 text-white">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-blue">
          LIFE VAULT
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight text-white">
          Everything you're
          <br />
          <span className="text-white/45">looking after.</span>
        </h1>
        <p className="mt-4 font-mono text-[11px] tracking-[0.18em] text-white/40">
          {String(totalHeld).padStart(2, "0")} ITEMS · HELD SAFELY ON THIS DEVICE
        </p>
      </header>

      <section className="animate-reveal px-6" style={{ animationDelay: "80ms" }}>
        <ul className="space-y-2">
          {stats.map((cat) => {
            const Icon = CATEGORY_ICON[cat.id];
            const dot =
              cat.worst === "attention"
                ? "bg-[color:var(--clay)]"
                : cat.worst === "soon"
                  ? "bg-[color:var(--sea-500)]"
                  : "bg-white/15";
            return (
              <li key={cat.id}>
                <Link
                  to="/category/$categoryId"
                  params={{ categoryId: cat.id }}
                  className="group flex items-center justify-between gap-4 rounded-2xl glass p-4 transition-all active:scale-[0.99] hover:bg-white/[0.06]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                      <Icon
                        className="size-4 text-white/75"
                        strokeWidth={1.6}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[16px] font-medium tracking-tight text-white">
                        {cat.name}
                      </p>
                      <p className="mt-0.5 text-[12px] text-white/45">
                        {cat.subtitle} ·{" "}
                        {cat.count === 0
                          ? "empty"
                          : `${cat.count} ${cat.count === 1 ? "item" : "items"}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className={`size-1.5 rounded-full ${dot}`} />
                    <ChevronRight
                      className="size-4 text-white/25 transition-colors group-hover:text-white/60"
                      strokeWidth={1.5}
                    />
                  </div>
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
