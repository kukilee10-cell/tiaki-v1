import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CATEGORY_ICON } from "./icons";
import {
  addItem,
  CATEGORIES,
  requestNotificationPermission,
  type CategoryId,
} from "@/lib/tiaki-storage";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultCategory?: CategoryId;
}

/**
 * "Protect Something" — the single capture flow used across TIAKI.
 * A dark, glassy bottom sheet with category picker, title, date, notes.
 */
export function ProtectSheet({ open, onClose, defaultCategory }: Props) {
  const [category, setCategory] = useState<CategoryId>(
    defaultCategory ?? "documents",
  );
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setCategory(defaultCategory ?? "documents");
      setTitle("");
      setDueDate("");
      setNotes("");
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, defaultCategory]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    requestNotificationPermission();
    addItem({
      categoryId: category,
      title: title.trim(),
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-label="Protect something"
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
          >
            <div
              className="glass-strong overflow-hidden rounded-t-[28px] px-5 pt-3 pb-8"
              style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
            >
              {/* grabber */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15" />

              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Protect something
                  </p>
                  <h2 className="mt-1 font-display text-[28px] leading-none tracking-tight text-white">
                    Add to the vault
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="grid size-9 place-items-center rounded-full bg-white/6 text-white/70 transition-colors hover:bg-white/12"
                  aria-label="Close"
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                {/* Category chips */}
                <div>
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Category
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {CATEGORIES.map((c) => {
                      const Icon = CATEGORY_ICON[c.id];
                      const active = category === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCategory(c.id)}
                          className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] transition-all ${
                            active
                              ? "border-[color:var(--sea-500)]/60 bg-[color:var(--sea-500)]/15 text-white"
                              : "border-white/8 bg-white/[0.03] text-white/60 hover:text-white"
                          }`}
                        >
                          <Icon className="size-3.5" strokeWidth={1.75} />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    What are you protecting?
                  </span>
                  <input
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Passport expiry"
                    className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 font-display text-[19px] tracking-tight text-white placeholder:text-white/25 focus:border-[color:var(--sea-500)]/50 focus:bg-white/[0.05] focus:outline-none"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                      Reminder date
                    </span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3.5 py-3 font-mono text-sm text-white/90 focus:border-[color:var(--sea-500)]/50 focus:outline-none"
                    />
                  </label>
                  <div className="flex items-end">
                    <p className="pb-3 font-mono text-[10px] leading-relaxed text-white/35">
                      Tiaki quietly<br />reminds you.
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
                    Notes
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Policy number, reference, anything worth remembering…"
                    className="w-full resize-none rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/90 placeholder:text-white/25 focus:border-[color:var(--sea-500)]/50 focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="mt-2 grid w-full place-items-center rounded-2xl py-3.5 font-medium text-primary-foreground transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    background: "linear-gradient(180deg, #a8c5ff, #5a8dff)",
                    boxShadow: "0 8px 24px -8px rgba(126,169,255,0.55), inset 0 1px 0 rgba(255,255,255,0.2)",
                  }}
                >
                  Protect it
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
