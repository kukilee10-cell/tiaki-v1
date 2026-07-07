import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
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

// Category → accent glow color (used for icon tints on tiles)
const CATEGORY_ACCENT: Record<string, { text: string; bg: string; ring: string }> = {
  documents:   { text: "text-[#a8c5ff]", bg: "bg-[#7ea9ff]/12", ring: "shadow-[0_0_28px_-6px_rgba(126,169,255,0.55)]" },
  vehicles:    { text: "text-[#7ff0c2]", bg: "bg-[#78ebbe]/12", ring: "shadow-[0_0_28px_-6px_rgba(120,235,190,0.5)]" },
  home:        { text: "text-[#ffc999]", bg: "bg-[#ffb478]/12", ring: "shadow-[0_0_28px_-6px_rgba(255,180,120,0.5)]" },
  travel:      { text: "text-[#c9b0ff]", bg: "bg-[#aa78ff]/12", ring: "shadow-[0_0_28px_-6px_rgba(170,120,255,0.5)]" },
  family:      { text: "text-[#ff9fb8]", bg: "bg-[#ff7ea1]/12", ring: "shadow-[0_0_28px_-6px_rgba(255,126,161,0.5)]" },
  pets:        { text: "text-[#ffe08a]", bg: "bg-[#ffd166]/12", ring: "shadow-[0_0_28px_-6px_rgba(255,209,102,0.5)]" },
  reminders:   { text: "text-[#7ea9ff]", bg: "bg-[#7ea9ff]/12", ring: "shadow-[0_0_28px_-6px_rgba(126,169,255,0.5)]" },
  maintenance: { text: "text-[#a8c5ff]", bg: "bg-[#a8c5ff]/12", ring: "shadow-[0_0_28px_-6px_rgba(168,197,255,0.45)]" },
  personal:    { text: "text-[#f0b8ff]", bg: "bg-[#e59bff]/12", ring: "shadow-[0_0_28px_-6px_rgba(229,155,255,0.45)]" },
};

function Dashboard() {
  const items = useTiakiItems();
  const profile = useTiakiProfile();

  // Locale-independent date to avoid SSR/CSR hydration mismatch.
  const dateLabel = useMemo(() => {
    const d = new Date();
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
    return `${days[d.getDay()]} · ${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]}`;
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
  const totalHeld = items.length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-vault pb-40 text-white">
      {/* Ambient drifting orbs — the "living light" behind the vault */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 size-[380px] rounded-full opacity-70 animate-halo"
        style={{
          background:
            "radial-gradient(closest-side, rgba(170,120,255,0.55), rgba(126,169,255,0.25) 55%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -left-32 size-[340px] rounded-full opacity-60 animate-halo"
        style={{
          animationDelay: "-6s",
          background:
            "radial-gradient(closest-side, rgba(120,235,190,0.45), rgba(126,169,255,0.20) 55%, transparent 75%)",
          filter: "blur(60px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-2/3 right-1/4 size-[280px] rounded-full opacity-55 animate-halo"
        style={{
          animationDelay: "-11s",
          background:
            "radial-gradient(closest-side, rgba(255,180,120,0.40), transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Header */}
      <header className="relative animate-reveal px-6 pt-14 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className="font-mono text-[11px] tracking-[0.22em] text-blue"
              suppressHydrationWarning
            >
              {dateLabel}
            </p>
            <h1 className="mt-3 font-display text-[36px] leading-[1.02] tracking-tight text-white">
              Kia Orana,
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(120deg, #ffffff 0%, #c9b0ff 40%, #7ea9ff 70%, #78ebbe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {profile.name}.
              </span>
            </h1>
            <p className="mt-4 max-w-[22rem] text-[14px] leading-relaxed text-white/60">
              {attentionCount === 0
                ? "All is quiet. Everything precious is held safely."
                : `${attentionCount} ${attentionCount === 1 ? "thing needs" : "things need"} a moment of care.`}
            </p>
          </div>
          {/* Gradient-ring avatar chip */}
          <div className="shrink-0 rounded-full p-[1.5px]"
               style={{
                 background:
                   "conic-gradient(from 140deg, #7ea9ff, #aa78ff, #ffb478, #78ebbe, #7ea9ff)",
               }}>
            <div className="grid size-11 place-items-center rounded-full bg-[#0a0a10]">
              <span className="font-mono text-[11px] tracking-tight text-white/80">
                {(profile.name?.[0] ?? "T").toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Next up — iridescent hero card */}
      {nextUp ? (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
          className="relative px-6"
        >
          <div className="group relative">
            {/* iridescent halo behind the card */}
            <div
              aria-hidden
              className="absolute -inset-[3px] rounded-[30px] opacity-60 blur-xl transition-opacity duration-700 group-hover:opacity-90"
              style={{
                background:
                  "conic-gradient(from 140deg at 50% 50%, rgba(126,169,255,0.9), rgba(170,120,255,0.85), rgba(255,180,120,0.7), rgba(120,235,190,0.85), rgba(126,169,255,0.9))",
              }}
            />
            <Link
              to="/category/$categoryId"
              params={{ categoryId: nextUp.categoryId }}
              className="relative block overflow-hidden rounded-[28px] border border-white/12 bg-[rgba(12,12,16,0.72)] p-6 backdrop-blur-2xl transition-transform active:scale-[0.99]"
            >
              {/* inner sheen */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.09), transparent)",
                }}
              />

              <div className="mb-5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7ea9ff]/30 bg-[#7ea9ff]/12 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#a8c5ff]">
                  <Sparkles className="size-3" strokeWidth={2} />
                  Next up
                </span>
                <div className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/[0.05]">
                  <NextIcon className="size-4 text-white/80" strokeWidth={1.6} />
                </div>
              </div>

              <p className="font-display text-[28px] leading-[1.08] tracking-tight text-white">
                {nextUp.title}
              </p>
              <p className="mt-2 text-[13px] text-white/55">
                {CATEGORIES.find((c) => c.id === nextUp.categoryId)?.name} ·{" "}
                {formatDueLabel(nextUp.dueDate)}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className="flex-1 rounded-2xl py-3 text-center text-[13px] font-semibold text-[#0a0a10]"
                  style={{
                    background:
                      "linear-gradient(180deg, #ffffff 0%, #d8e4ff 100%)",
                    boxShadow:
                      "0 10px 32px -10px rgba(126,169,255,0.6), inset 0 1px 0 rgba(255,255,255,0.5)",
                  }}
                >
                  Take care of it
                </div>
                <div
                  className="grid min-w-[64px] place-items-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  <p className="font-mono text-[22px] leading-none text-white">
                    {nextUp.dueDate ? daysUntil(nextUp.dueDate) : "—"}
                  </p>
                  <p className="mt-1 font-mono text-[9px] tracking-[0.22em] text-white/45">
                    DAYS
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </motion.section>
      ) : (
        <section className="relative px-6">
          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-2xl">
            <p className="font-mono text-[10px] tracking-[0.22em] text-white/45">
              THE VAULT IS CALM
            </p>
            <p className="mt-3 font-display text-[24px] leading-tight tracking-tight text-white">
              Nothing needs you right now.
            </p>
            <p className="mt-2 text-[13px] text-white/55">
              Tap the glowing button below to protect something.
            </p>
          </div>
        </section>
      )}

      {/* Ready for care shelf */}
      {activeCare.length > (nextUp ? 1 : 0) && (
        <section
          className="relative animate-reveal px-6 pt-8"
          style={{ animationDelay: "180ms" }}
        >
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
              const accent = CATEGORY_ACCENT[item.categoryId];
              const isAttention = item.status === "attention";
              return (
                <li key={item.id}>
                  <Link
                    to="/category/$categoryId"
                    params={{ categoryId: item.categoryId }}
                    className="group flex items-center gap-3.5 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-3.5 backdrop-blur-xl transition-all hover:bg-white/[0.06]"
                  >
                    <div
                      className={`grid size-10 shrink-0 place-items-center rounded-xl ${accent.bg} ${accent.ring}`}
                    >
                      <Icon
                        className={`size-[18px] ${accent.text}`}
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
                    {isAttention && (
                      <span
                        className="mr-1 size-1.5 rounded-full bg-[color:var(--clay)]"
                        style={{
                          boxShadow: "0 0 12px 2px rgba(217,180,140,0.6)",
                        }}
                      />
                    )}
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
      <section
        className="relative animate-reveal px-6 pt-10"
        style={{ animationDelay: "280ms" }}
      >
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-mono text-[10px] tracking-[0.22em] text-white/45">
            LIFE VAULT
          </h2>
          <div className="flex items-baseline gap-3">
            <span
              className="font-mono text-[10px] tracking-[0.18em] text-white/35"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {String(totalHeld).padStart(2, "0")} HELD
            </span>
            <Link
              to="/all"
              className="font-mono text-[10px] tracking-[0.18em] text-white/45 transition-colors hover:text-white/80"
            >
              OPEN →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
  const accent = CATEGORY_ACCENT[id];
  const dotColor =
    worst === "attention"
      ? "bg-[color:var(--clay)] shadow-[0_0_10px_2px_rgba(217,180,140,0.6)]"
      : worst === "soon"
        ? "bg-[#7ea9ff] shadow-[0_0_10px_2px_rgba(126,169,255,0.6)]"
        : "bg-white/15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.55,
        delay: 0.3 + delay / 1000,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        to="/category/$categoryId"
        params={{ categoryId: id }}
        className="group relative flex aspect-[1.05/1] flex-col justify-between overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.035] p-4 backdrop-blur-xl transition-all active:scale-[0.98] hover:border-white/15 hover:bg-white/[0.06]"
      >
        {/* tile inner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-70 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(closest-side, ${
              {
                documents: "rgba(126,169,255,0.35)",
                vehicles: "rgba(120,235,190,0.30)",
                home: "rgba(255,180,120,0.28)",
                travel: "rgba(170,120,255,0.30)",
                family: "rgba(255,126,161,0.28)",
                pets: "rgba(255,209,102,0.28)",
                reminders: "rgba(126,169,255,0.28)",
                maintenance: "rgba(168,197,255,0.24)",
                personal: "rgba(229,155,255,0.24)",
              }[id] ?? "rgba(126,169,255,0.28)"
            }, transparent 70%)`,
            filter: "blur(6px)",
          }}
        />

        <div className="relative flex items-start justify-between">
          <div
            className={`grid size-10 place-items-center rounded-xl ${accent.bg} ${accent.ring}`}
          >
            <Icon className={`size-[18px] ${accent.text}`} strokeWidth={1.6} />
          </div>
          <span className={`mt-1.5 size-1.5 rounded-full ${dotColor}`} />
        </div>
        <div className="relative">
          <p className="text-[15px] font-medium tracking-tight text-white">
            {name}
          </p>
          <p
            className="mt-0.5 font-mono text-[11px] text-white/45"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {count === 0 ? "Empty" : `${String(count).padStart(2, "0")} held`}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
