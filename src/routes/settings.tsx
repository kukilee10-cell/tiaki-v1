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
    <div className="min-h-screen bg-sand-50 pb-32 text-leaf-900">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-leaf-800/60">
          You & Tiaki
        </p>
        <h1 className="font-display text-5xl italic leading-none">
          Quiet
          <br />
          <span className="text-leaf-800/40">settings.</span>
        </h1>
      </header>

      <div className="space-y-6 px-6">
        <Panel title="Your name">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={handleSaveName}
              placeholder="What should Tiaki call you?"
              className="flex-1 border-b border-leaf-900/10 bg-transparent pb-2 font-display text-2xl italic placeholder:text-leaf-800/25 focus:border-leaf-900 focus:outline-none"
            />
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
            Stays on this device only
          </p>
        </Panel>

        <Panel title="Local notifications">
          <p className="mb-4 text-sm text-leaf-800/70">
            Tiaki uses gentle on-device reminders — no accounts, no push
            servers. Enable browser notifications to be nudged when things are
            due.
          </p>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/50">
              Status: {notifState}
            </span>
            {notifState === "default" && (
              <button
                onClick={handleEnableNotifs}
                className="rounded-full bg-leaf-900 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-sand-50"
              >
                Enable
              </button>
            )}
          </div>
        </Panel>

        <Panel title="Your data">
          <div className="space-y-1 font-mono text-[11px] text-leaf-800/60">
            <p>· Stored locally in this browser</p>
            <p>· No cloud sync, no login, no tracking</p>
            <p>· {items.length} item{items.length === 1 ? "" : "s"} saved</p>
          </div>
          <button
            onClick={handleClearAll}
            className="mt-5 rounded-full border border-clay/40 px-5 py-2 font-mono text-[10px] uppercase tracking-widest text-clay transition-colors hover:bg-clay/10"
          >
            Clear all data
          </button>
        </Panel>

        <div className="pt-6 text-center">
          <p className="font-display text-lg italic text-leaf-800/50">
            "Set it once. Let Tiaki do the rest."
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-leaf-900/5 bg-white p-6">
      <h2 className="mb-4 font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
        {title}
      </h2>
      {children}
    </section>
  );
}
