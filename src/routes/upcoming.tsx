import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { useTiakiItems } from "@/hooks/use-tiaki";
import { formatDueLabel, statusForDate } from "@/lib/tiaki-storage";

export const Route = createFileRoute("/upcoming")({
  component: Upcoming,
});

function Upcoming() {
  const items = useTiakiItems();

  const sections = useMemo(() => {
    const withDate = items
      .filter((i) => i.dueDate)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
    const attention = withDate.filter(
      (i) => statusForDate(i.dueDate) === "attention",
    );
    const soon = withDate.filter((i) => statusForDate(i.dueDate) === "soon");
    const later = withDate.filter((i) => statusForDate(i.dueDate) === "good");
    return { attention, soon, later };
  }, [items]);

  return (
    <div className="min-h-screen bg-sand-50 pb-32 text-leaf-900">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-leaf-800/60">
          What's coming
        </p>
        <h1 className="font-display text-5xl italic leading-none">
          Upcoming,
          <br />
          <span className="text-leaf-800/40">nothing forgotten.</span>
        </h1>
      </header>

      <div className="space-y-10 px-6">
        <TimelineGroup
          title="Needs attention"
          tone="clay"
          items={sections.attention}
        />
        <TimelineGroup title="Due soon" tone="sea" items={sections.soon} />
        <TimelineGroup title="Later" tone="muted" items={sections.later} />

        {items.filter((i) => i.dueDate).length === 0 && (
          <div className="rounded-3xl border border-dashed border-leaf-900/10 bg-white/40 p-8 text-center">
            <p className="font-display text-2xl italic text-leaf-800">
              Your calendar is clear.
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-leaf-800/40">
              Add a date to anything and it will appear here.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function TimelineGroup({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "clay" | "sea" | "muted";
  items: ReturnType<typeof useTiakiItems>;
}) {
  if (items.length === 0) return null;
  const dot =
    tone === "clay"
      ? "bg-clay"
      : tone === "sea"
        ? "bg-sea-500"
        : "bg-leaf-800/20";
  const label =
    tone === "clay"
      ? "text-clay"
      : tone === "sea"
        ? "text-sea-600"
        : "text-leaf-800/50";
  return (
    <section className="animate-reveal">
      <div className="mb-4 flex items-center gap-2">
        <span className={`size-1.5 rounded-full ${dot}`} />
        <h2
          className={`font-mono text-[10px] uppercase tracking-widest ${label}`}
        >
          {title}
        </h2>
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const Icon = CATEGORY_ICON[item.categoryId];
          return (
            <li key={item.id}>
              <Link
                to="/category/$categoryId"
                params={{ categoryId: item.categoryId }}
                className="flex items-center gap-4 rounded-2xl border border-leaf-900/5 bg-white p-4"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-sand-100">
                  <Icon
                    className="size-4 text-leaf-800/60"
                    strokeWidth={1.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg leading-tight">
                    {item.title}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
                    {item.categoryId} · {formatDueLabel(item.dueDate)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
