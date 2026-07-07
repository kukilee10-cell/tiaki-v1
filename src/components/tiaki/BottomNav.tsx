import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Layers, Plus, Settings2 } from "lucide-react";
import { useState } from "react";
import { ProtectSheet } from "./ProtectSheet";

const tabs = [
  { to: "/", label: "Today", icon: CalendarDays },
  { to: "/all", label: "Vault", icon: Layers },
] as const;

const rightTabs = [
  { to: "/upcoming", label: "Upcoming", icon: CalendarDays },
  { to: "/settings", label: "You", icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full glass-strong px-2 py-2"
        style={{ minWidth: "min(92vw, 380px)" }}
        aria-label="Primary"
      >
        <NavTab to="/" label="Today" Icon={CalendarDays} active={pathname === "/"} />
        <NavTab to="/all" label="Vault" Icon={Layers} active={pathname === "/all"} />

        {/* Center FAB — Protect Something */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Protect something"
          className="relative mx-1 grid size-12 shrink-0 place-items-center rounded-full text-primary-foreground transition-transform active:scale-95"
          style={{
            background: "linear-gradient(180deg, #a8c5ff, #5a8dff)",
            boxShadow:
              "0 0 0 1px rgba(255,255,255,0.12) inset, 0 8px 24px -6px rgba(126,169,255,0.55), 0 2px 4px rgba(0,0,0,0.4)",
          }}
        >
          <span className="absolute inset-0 rounded-full animate-glow" style={{
            background: "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.35), transparent 60%)",
          }} />
          <Plus className="relative size-5" strokeWidth={2.25} />
        </button>

        <NavTab to="/upcoming" label="Upcoming" Icon={rightTabs[0].icon} active={pathname === "/upcoming"} />
        <NavTab to="/settings" label="You" Icon={Settings2} active={pathname === "/settings"} />
      </nav>

      <ProtectSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NavTab({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: typeof CalendarDays;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-2.5 transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/40 hover:text-white/80"
      }`}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-[17px]" strokeWidth={1.75} />
      {active && (
        <span className="text-[11px] font-medium tracking-tight">{label}</span>
      )}
    </Link>
  );
}
