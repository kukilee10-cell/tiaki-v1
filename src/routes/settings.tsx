import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { useTiakiItems, useTiakiProfile } from "@/hooks/use-tiaki";
import {
  loadProfile,
  requestNotificationPermission,
  saveItems,
  saveProfile,
} from "@/lib/tiaki-storage";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

function Settings() {
  const profile = useTiakiProfile();
  const items = useTiakiItems();
  const [name, setName] = useState(profile.name);
  const [notifState, setNotifState] = useState<string>("unknown");

  useEffect(() => setName(loadProfile().name), []);
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifState(Notification.permission);
    } else {
      setNotifState("unsupported");
    }
  }, []);

  function handleSaveName() {
    saveProfile({ name: name.trim() || "friend" });
  }

  function handleEnableNotifs() {
    requestNotificationPermission();
    setTimeout(() => {
      if ("Notification" in window) setNotifState(Notification.permission);
    }, 300);
  }

  function handleClearAll() {
    if (!confirm("Delete every item on this device? This cannot be undone."))
      return;
    saveItems([]);
  }

  return (
    <div className="min-h-screen bg-vault pb-36 text-white">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="font-mono text-[11px] tracking-[0.22em] text-blue">
          YOU & TIAKI
        </p>
        <h1 className="mt-3 font-display text-[34px] leading-[1.05] tracking-tight text-white">
          Quiet
          <br />
          <span className="text-white/45">settings.</span>
        </h1>
      </header>

      <div className="space-y-4 px-6">
        <Panel title="YOUR NAME">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleSaveName}
            placeholder="What should Tiaki call you?"
            className="w-full border-b border-white/10 bg-transparent pb-2 font-display text-[22px] tracking-tight text-white placeholder:text-white/25 focus:border-[color:var(--sea-500)] focus:outline-none"
          />
          <p className="mt-2 font-mono text-[10px] tracking-[0.18em] text-white/35">
            STAYS ON THIS DEVICE ONLY
          </p>
        </Panel>

        <Panel title="LOCAL NOTIFICATIONS">
          <p className="mb-4 text-[13px] leading-relaxed text-white/60">
            Tiaki uses gentle on-device reminders — no accounts, no push
            servers. Enable browser notifications to be nudged when things
            need care.
          </p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">
              STATUS · {notifState.toUpperCase()}
            </span>
            {notifState === "default" && (
              <button
                onClick={handleEnableNotifs}
                className="rounded-full px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-primary-foreground"
                style={{
                  background: "linear-gradient(180deg, #a8c5ff, #5a8dff)",
                  boxShadow: "0 6px 16px -6px rgba(126,169,255,0.55)",
                }}
              >
                ENABLE
              </button>
            )}
          </div>
        </Panel>

        <Panel title="YOUR DATA">
          <div className="space-y-1.5 text-[13px] text-white/60">
            <p>· Stored locally in this browser</p>
            <p>· No cloud sync, no login, no tracking</p>
            <p>
              ·{" "}
              <span className="font-mono text-white/80">
                {String(items.length).padStart(2, "0")}
              </span>{" "}
              item{items.length === 1 ? "" : "s"} held safely
            </p>
          </div>
          <button
            onClick={handleClearAll}
            className="mt-5 rounded-full border border-[color:var(--destructive)]/40 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[color:var(--destructive)] transition-colors hover:bg-[color:var(--destructive)]/10"
          >
            CLEAR ALL DATA
          </button>
        </Panel>

        <div className="pt-6 text-center">
          <p className="font-display text-[18px] italic text-white/40">
            "Set it once. Let Tiaki do the rest."
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[22px] glass p-5">
      <h2 className="mb-4 font-mono text-[10px] tracking-[0.22em] text-white/40">
        {title}
      </h2>
      {children}
    </section>
  );
}
