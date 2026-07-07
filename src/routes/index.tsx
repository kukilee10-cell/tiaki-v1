import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { useTiakiItems, useTiakiProfile } from "@/hooks/use-tiaki";
import {
  CATEGORIES,
  daysUntil,
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

  const dateLabel = useMemo(() => {
    const d = new Date();
    return d
      .toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "2-digit",
      })
      .toUpperCase()
      .replace(",", " ·");
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 5) return "Late night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 21) return "Good evening";
    return "Good night";
  }, []);

  const activeCare = useMemo(
    () =>
      items
        .filter((i) => i.dueDate)
        .map((i) => ({ ...i, status: statusForDate(i.dueDate) }))
        .filter((i) => i.status !== "good")
        .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""))
        .slice(0, 4),
    [items],
  );

  const nextUp = activeCare[0];
  const NextIcon = nextUp ? CATEGORY_ICON[nextUp.categoryId] : ShieldCheck;

  const categoryStats = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const catItems = items.filter((i) => i.categoryId === cat.id);
      const worst: Status = catItems.reduce<Status>((acc, i) => {
        const s = statusForDate(i.dueDate);
        if (s === "attention") return "attention";
        if (s === "soon" && acc !== "attention") return "soon";
        return acc;
      }, "good");
      return { ...cat, count: catItems.length, worst };
    });
  }, [items]);

  const attentionCount = categoryStats.reduce(
    (n, c) => n + (c.worst === "attention" ? 1 : 0),
    0,
  );

  return (
    <div className="min-h-screen bg-vault pb-36 text-white">
      {/* Header */}
      <header className="animate-reveal px-6 pt-14 pb-6">
        <p className="font-mono text-[11px] tracking-[0.22em] text-blue">
          {dateLabel}
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight text-white">
          {greeting},
          <br />
          <span className="text-white/45">{profile.name}.</span>
        </h1>
        <p className="mt-4 max-w-[22rem] text-[14px] leading-relaxed text-white/55">
          {attentionCount === 0
            ? "All is quiet. The important parts of your life are held safely."
            : `${attentionCount} ${attentionCount === 1 ? "thing needs" : "things need"} a moment of care.`}
        </p>
      </header>

      {/* Next up — hero blue card */}
      {nextUp && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="px-6"
        >
          <Link
            to="/category/$categoryId"
            params={{ categoryId: nextUp.categoryId }}
            className="relative block overflow-hidden rounded-[26px] blue-card p-5 transition-transform active:scale-[0.99]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[0.22em] text-blue">
                  NEXT UP
                </p>
                <p className="mt-3 font-display text-[26px] leading-tight tracking-tight text-white">
                  {nextUp.title}
                </p>
                <p className="mt-1.5 text-[13px] text-white/55">
                  {CATEGORIES.find((c) => c.id === nextUp.categoryId)?.name} ·{" "}
                  {formatDueLabel(nextUp.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className="font-mono text-[26px] leading-none tracking-tight text-blue"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {nextUp.dueDate ? daysUntil(nextUp.dueDate) : "—"}
                </p>
                <p className="mt-1 font-mono text-[9px] tracking-[0.22em] text-white/40">
                  DAYS
                </p>
              </div>
            </div>
          </Link>
        </motion.section>
      )}

      {/* Active care shelf */}
      {activeCare.length > 0 && (
        <section className="animate-reveal px-6 pt-8" style={{ animationDelay: "180ms" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[10px] tracking-[0.22em] text-white/45">
              READY FOR CARE
            </h2>
            <Link
              to="/upcoming"
              className="font-mono text-[10px] tracking-[0.18em] text-white/45 transition-colors hover:text-white/80"
            >
              ALL →
            </Link>
          </div>
          <ul className="space-y-2">
            {activeCare.slice(nextUp ? 1 : 0).map((item) => {
              const Icon = CATEGORY_ICON[item.categoryId];
              const isAttention = item.status === "attention";
              return (
                <li key={item.id}>
                  <Link
                    to="/category/$categoryId"
                    params={{ categoryId: item.categoryId }}
                    className="group flex items-center gap-3.5 rounded-2xl glass px-4 py-3.5 transition-all hover:bg-white/[0.06]"
                  >
                    <div
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                        isAttention ? "gold-tint" : "bg-white/[0.05]"
                      }`}
                    >
                      <Icon
                        className={`size-4 ${isAttention ? "text-[color:var(--clay)]" : "text-white/70"}`}
                        strokeWidth={1.6}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium text-white">
                        {item.title}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] tracking-[0.14em] text-white/45">
                        {formatDueLabel(item.dueDate)}
                      </p>
                    </div>
                    <ChevronRight
                      className="size-4 text-white/25 transition-colors group-hover:text-white/60"
                      strokeWidth={1.5}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Life Vault grid */}
      <section className="animate-reveal px-6 pt-10" style={{ animationDelay: "280ms" }}>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-white/45">
            LIFE VAULT
          </h2>
          <Link
            to="/all"
            className="font-mono text-[10px] tracking-[0.18em] text-white/45 transition-colors hover:text-white/80"
          >
            OPEN VAULT →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {categoryStats.slice(0, 6).map((cat, i) => (
            <VaultTile key={cat.id} {...cat} delay={i * 40} />
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}

function VaultTile({
  id,
  name,
  count,
  worst,
  delay,
}: {
  id: string;
  name: string;
  count: number;
  worst: Status;
  delay: number;
}) {
  const Icon = CATEGORY_ICON[id as keyof typeof CATEGORY_ICON];
  const dotColor =
    worst === "attention"
      ? "bg-[color:var(--clay)]"
      : worst === "soon"
        ? "bg-[color:var(--sea-500)]"
        : "bg-white/15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 + delay / 1000, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        to="/category/$categoryId"
        params={{ categoryId: id }}
        className="group relative flex aspect-[1.05/1] flex-col justify-between rounded-[22px] glass p-4 transition-all active:scale-[0.98] hover:bg-white/[0.06]"
      >
        <div className="flex items-start justify-between">
          <div className="grid size-9 place-items-center rounded-xl bg-white/[0.05]">
            <Icon className="size-4 text-white/75" strokeWidth={1.6} />
          </div>
          <span className={`mt-1.5 size-1.5 rounded-full ${dotColor}`} />
        </div>
        <div>
          <p className="text-[15px] font-medium tracking-tight text-white">
            {name}
          </p>
          <p
            className="mt-0.5 font-mono text-[11px] text-white/40"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {count === 0 ? "Empty" : `${String(count).padStart(2, "0")} held`}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
