import { Link, useRouterState } from "@tanstack/react-router";
import {
  Boxes,
  LayoutGrid,
  Receipt,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { statusFor, STATUS_LABEL, type Product } from "@/lib/stock-storage";

export function AppHeader({ sub }: { sub?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-steel-700 bg-steel-950/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="grid size-9 place-items-center rounded-[3px] bg-hivis">
          <span className="font-display text-[17px] font-bold leading-none text-primary-foreground">
            R
          </span>
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[19px] font-semibold uppercase leading-none tracking-[0.06em]">
            Rotation Co.
          </h1>
          <p className="label-industrial mt-1">{sub ?? "Warehouse & Inventory"}</p>
        </div>
      </div>
      <div className="hazard-bar h-[3px] w-full" />
    </header>
  );
}

export function SectionTitle({
  children,
  right,
}: {
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-end justify-between border-b border-steel-700 pb-1.5">
      <h2 className="label-industrial text-foreground">{children}</h2>
      {right}
    </div>
  );
}

export function StatusTag({ product }: { product: Product }) {
  const s = statusFor(product);
  const color =
    s === "in_stock" ? "var(--ok)" : s === "low" ? "var(--warn)" : "var(--crit)";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[2px] px-1.5 py-[3px] font-mono text-[9px] tracking-[0.12em]"
      style={{
        color,
        border: `1px solid ${color}`,
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {STATUS_LABEL[s]}
    </span>
  );
}

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "hivis" | "warn" | "default";
}) {
  const color =
    accent === "hivis"
      ? "var(--hivis)"
      : accent === "warn"
        ? "var(--warn)"
        : "var(--foreground)";
  return (
    <div className="panel-raised px-3 py-2.5">
      <p className="label-industrial">{label}</p>
      <p className="num-xl mt-1 text-[26px] leading-none" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

const TABS: { to: string; label: string; Icon: LucideIcon }[] = [
  { to: "/", label: "Dash", Icon: LayoutGrid },
  { to: "/stock", label: "Stock", Icon: Boxes },
  { to: "/sales", label: "Sales", Icon: Receipt },
  { to: "/documents", label: "Dockets", Icon: FileText },
];

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-steel-700 bg-steel-900"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      {TABS.map(({ to, label, Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? "page" : undefined}
            className="flex flex-col items-center gap-1 py-2.5 transition-colors"
            style={{
              color: active ? "var(--hivis)" : "var(--steel-400)",
              boxShadow: active ? "inset 0 2px 0 0 var(--hivis)" : undefined,
              background: active ? "var(--steel-800)" : undefined,
            }}
          >
            <Icon className="size-[18px]" strokeWidth={1.9} />
            <span className="font-mono text-[9px] tracking-[0.1em] uppercase">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Screen({
  children,
  sub,
}: {
  children: ReactNode;
  sub?: string;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader sub={sub} />
      <main className="px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
