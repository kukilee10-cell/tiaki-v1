import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Bell, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Today", icon: Home },
  { to: "/all", label: "Life", icon: LayoutGrid },
  { to: "/upcoming", label: "Upcoming", icon: Bell },
  { to: "/settings", label: "You", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed bottom-6 left-1/2 z-40 flex w-[calc(100%-48px)] max-w-[342px] -translate-x-1/2 items-center justify-between rounded-full bg-leaf-900/95 px-3 py-3 shadow-2xl shadow-leaf-900/20 backdrop-blur-md">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex items-center gap-2 rounded-full px-4 py-2 transition-colors ${
              active
                ? "bg-sand-50 text-leaf-900"
                : "text-sand-50/50 hover:text-sand-50"
            }`}
            aria-label={tab.label}
          >
            <Icon className="size-4" strokeWidth={1.75} />
            {active && (
              <span className="font-mono text-[10px] uppercase tracking-widest">
                {tab.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
