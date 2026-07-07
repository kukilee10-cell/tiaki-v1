import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { useTiakiItems } from "@/hooks/use-tiaki";
import {
  formatDueLabel,
  statusForDate,
  type TiakiItem,
} from "@/lib/tiaki-storage";

export const Route = createFileRoute("/upcoming")({
  component: Upcoming,
});

function Upcoming() {
  const items = useTiakiItems();

  const sections = useMemo(() => {
    const withDate = items
      .filter((i) => i.dueDate)
      .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
    return {
      attention: withDate.filter((i) => statusForDate(i.dueDate) === "attention"),
      soon: withDate.filter((i) => statusForDate(i.dueDate) === "soon"),
      later: withDate.filter((i) => statusForDate(i.dueDate) === "good"),
    };
  }, [items]);

  const total = sections.attention.length + sections.soon.length + sections.later.length;

  return (
    <div className="min-h-screen bg-vault pb-36 text-white">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-blue">
          TIMELINE
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight text-white">
          Upcoming,
          <br />
          <span className="text-white/45">nothing forgotten.</span>
        </h1>
      </header>

      <div className="space-y-8 px-6">
        <TimelineGroup title="NEEDS ATTENTION" tone="gold" items={sections.attention} />
        <TimelineGroup title="COMING SOON" tone="blue" items={sections.soon} />
        <TimelineGroup title="ON THE HORIZON" tone="muted" items={sections.later} />

        {total === 0 && (
          <div className="rounded-3xl glass p-8 text-center">
            <p className="font-display text-[22px] tracking-tight text-white">
              Your timeline is clear.
            </p>
            <p className="mt-2 font-mono text-[11px] tracking-[0.18em] text-white/40">
              ADD A DATE TO ANYTHING AND IT APPEARS HERE
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
  tone: "gold" | "blue" | "muted";
  items: TiakiItem[];
}) {
  if (items.length === 0) return null;
  const dot =
    tone === "gold"
      ? "bg-[color:var(--clay)]"
      : tone === "blue"
        ? "bg-[color:var(--sea-500)]"
        : "bg-white/15";
  const label =
    tone === "gold"
      ? "text-[color:var(--clay)]"
      : tone === "blue"
        ? "text-blue"
        : "text-white/40";

  return (
    <section className="animate-reveal">
      <div className="mb-3 flex items-center gap-2">
        <span className={`size-1.5 rounded-full ${dot}`} />
        <h2 className={`font-mono text-[10px] tracking-[0.22em] ${label}`}>
          {title}
        </h2>
      </div>
      <ul className="relative space-y-2 pl-4">
        {/* vertical rail */}
        <span className="absolute left-1 top-2 bottom-2 w-px bg-white/8" />
        {items.map((item) => {
          const Icon = CATEGORY_ICON[item.categoryId];
          return (
            <li key={item.id} className="relative">
              <span
                className={`absolute -left-[13px] top-6 size-1.5 rounded-full ${dot}`}
                style={{ boxShadow: `0 0 0 3px rgba(9,9,11,1), 0 0 12px currentColor` }}
              />
              <Link
                to="/category/$categoryId"
                params={{ categoryId: item.categoryId }}
                className="flex items-center gap-3.5 rounded-2xl glass p-3.5 transition-all active:scale-[0.99] hover:bg-white/[0.06]"
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                  <Icon className="size-4 text-white/70" strokeWidth={1.6} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-white/45">
                    {item.categoryId.toUpperCase()} · {formatDueLabel(item.dueDate).toUpperCase()}
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
