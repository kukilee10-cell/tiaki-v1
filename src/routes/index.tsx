import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { useTiakiItems, useTiakiProfile } from "@/hooks/use-tiaki";
import {
  CATEGORIES,
  formatDueLabel,
  statusForDate,
  type Status,
} from "@/lib/tiaki-storage";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const items = useTiakiItems();
  const profile = useTiakiProfile();

  const today = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    [],
  );

  const stats = useMemo(() => {
    const counts: Record<Status, number> = { attention: 0, soon: 0, good: 0 };
    for (const item of items) counts[statusForDate(item.dueDate)]++;
    // "All good" also counts categories with zero items as settled
    return counts;
  }, [items]);

  const attentionItems = useMemo(
    () =>
      items
        .filter((i) => statusForDate(i.dueDate) === "attention")
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
        .slice(0, 3),
    [items],
  );

  const primary = attentionItems[0];
  const PrimaryIcon = primary ? CATEGORY_ICON[primary.categoryId] : null;

  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catItems = items.filter((i) => i.categoryId === cat.id);
      const next = catItems
        .filter((i) => i.dueDate)
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))[0];
      const worst: Status = catItems.reduce<Status>((acc, i) => {
        const s = statusForDate(i.dueDate);
        if (s === "attention") return "attention";
        if (s === "soon" && acc !== "attention") return "soon";
        return acc;
      }, "good");
      return { ...cat, count: catItems.length, next, worst };
    });
  }, [items]);

  const featured = categoryStats[0]; // Vehicles — hero card

  return (
    <div className="min-h-screen bg-sand-50 pb-32 font-sans text-leaf-900 selection:bg-leaf-900 selection:text-sand-50">
      {/* Header */}
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-leaf-800/60">
          {today}
        </p>
        <h1 className="text-balance font-display text-5xl leading-[1.05] italic">
          Kia orana,
          <br />
          <span className="text-leaf-800/40">{profile.name}.</span>
        </h1>
      </header>

      {/* Status strip */}
      <div className="animate-reveal px-6 [animation-delay:100ms]">
        <div className="flex items-end justify-between border-b border-leaf-900/10 pb-6">
          <StatusPill label="Attention" count={stats.attention} tone="clay" />
          <StatusPill label="Soon" count={stats.soon} tone="sea" />
          <StatusPill label="All good" count={stats.good} tone="muted" />
        </div>
      </div>

      {/* Attention */}
      <section className="animate-reveal px-6 pt-10 [animation-delay:200ms]">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
            {primary ? "Needs attention" : "Nothing urgent"}
          </h2>
          {attentionItems.length > 1 && (
            <Link
              to="/upcoming"
              className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/60 transition-colors hover:text-leaf-900"
            >
              See all →
            </Link>
          )}
        </div>

        {primary && PrimaryIcon ? (
          <Link
            to="/category/$categoryId"
            params={{ categoryId: primary.categoryId }}
            className="group relative block overflow-hidden rounded-3xl border border-leaf-900/5 bg-white p-6 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.08)]"
          >
            <div className="mb-5 flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 animate-pulse rounded-full bg-clay" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-clay">
                  {primary.categoryId}
                </span>
              </div>
              <PrimaryIcon
                className="size-5 text-leaf-800/30"
                strokeWidth={1.5}
              />
            </div>
            <p className="mb-1 font-display text-3xl italic leading-tight">
              {primary.title}
            </p>
            <p className="font-mono text-xs text-leaf-800/60">
              {formatDueLabel(primary.dueDate)}
            </p>
          </Link>
        ) : (
          <div className="rounded-3xl border border-leaf-900/5 bg-white p-6">
            <p className="font-display text-2xl italic text-leaf-800">
              Everything is settled.
            </p>
            <p className="mt-1 font-mono text-xs text-leaf-800/50">
              Add something to look after →{" "}
              <Link to="/all" className="underline underline-offset-2">
                begin
              </Link>
            </p>
          </div>
        )}
      </section>

      {/* Life categories */}
      <section className="animate-reveal px-6 pt-12 [animation-delay:300ms]">
        <h2 className="mb-6 font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
          Your archive
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Featured hero card (full width) */}
          {featured && (
            <FeaturedCard
              id={featured.id}
              name={featured.name}
              count={featured.count}
              next={featured.next?.title}
              worst={featured.worst}
            />
          )}

          {categoryStats.slice(1).map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              subtitle={cat.subtitle}
              count={cat.count}
              worst={cat.worst}
            />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

function StatusPill({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "clay" | "sea" | "muted";
}) {
  const toneClasses =
    tone === "clay"
      ? "text-clay"
      : tone === "sea"
        ? "text-sea-600"
        : "text-leaf-800/40";
  const labelClass =
    tone === "muted"
      ? "text-leaf-800/40"
      : "text-leaf-900";
  return (
    <div className="space-y-1">
      <span className={`font-mono text-sm ${toneClasses}`}>
        {String(count).padStart(2, "0")}
      </span>
      <p
        className={`font-mono text-[10px] uppercase tracking-widest ${labelClass}`}
      >
        {label}
      </p>
    </div>
  );
}

function FeaturedCard({
  id,
  name,
  count,
  next,
  worst,
}: {
  id: string;
  name: string;
  count: number;
  next?: string;
  worst: Status;
}) {
  const dot =
    worst === "attention"
      ? "bg-clay"
      : worst === "soon"
        ? "bg-sea-500"
        : "bg-sea-600";
  return (
    <Link
      to="/category/$categoryId"
      params={{ categoryId: id }}
      className="col-span-2 block rounded-3xl bg-leaf-900 p-6 text-sand-50 transition-all duration-500 hover:-translate-y-0.5"
    >
      <div className="mb-10 flex items-start justify-between">
        <span className="font-mono text-xs text-sand-50/40">
          {String(count).padStart(2, "0")}
        </span>
        <div className={`size-2 rounded-full ${dot}`} />
      </div>
      <p className="mb-1 font-display text-4xl italic">{name}</p>
      <p className="font-mono text-[11px] text-sand-50/40">
        {next ? `Next: ${next}` : "Nothing scheduled"}
      </p>
    </Link>
  );
}

function CategoryCard({
  id,
  name,
  subtitle,
  count,
  worst,
}: {
  id: string;
  name: string;
  subtitle: string;
  count: number;
  worst: Status;
}) {
  const Icon = CATEGORY_ICON[id as keyof typeof CATEGORY_ICON];
  const dot =
    worst === "attention"
      ? "bg-clay"
      : worst === "soon"
        ? "bg-sea-500"
        : "bg-leaf-800/20";
  return (
    <Link
      to="/category/$categoryId"
      params={{ categoryId: id }}
      className="group flex aspect-square flex-col justify-between rounded-3xl border border-leaf-900/5 bg-sand-100 p-5 transition-all duration-500 hover:-translate-y-0.5 hover:bg-white"
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs text-leaf-800/40">
          {String(count).padStart(2, "0")}
        </span>
        <div className={`size-1.5 rounded-full ${dot}`} />
      </div>
      <div>
        <Icon
          className="mb-3 size-4 text-leaf-800/50"
          strokeWidth={1.5}
        />
        <p className="font-display text-xl leading-tight">
          {name}
          <br />
          <span className="italic text-leaf-800/40">{subtitle}</span>
        </p>
      </div>
    </Link>
  );
}
