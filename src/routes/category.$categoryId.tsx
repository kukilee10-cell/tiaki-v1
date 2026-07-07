import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { ProtectSheet } from "@/components/tiaki/ProtectSheet";
import { SwipeItem } from "@/components/tiaki/SwipeItem";
import { useTiakiItems } from "@/hooks/use-tiaki";
import {
  deleteItem,
  formatDueLabel,
  getCategory,
  statusForDate,
  type CategoryId,
} from "@/lib/tiaki-storage";

export const Route = createFileRoute("/category/$categoryId")({
  component: CategoryPage,
});

function CategoryPage() {
  const { categoryId } = Route.useParams();
  const navigate = useNavigate();
  const items = useTiakiItems();
  const [sheetOpen, setSheetOpen] = useState(false);

  const category = getCategory(categoryId as CategoryId);

  const catItems = useMemo(
    () =>
      items
        .filter((i) => i.categoryId === categoryId)
        .sort((a, b) =>
          (a.dueDate || "9999").localeCompare(b.dueDate || "9999"),
        ),
    [items, categoryId],
  );

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vault px-6 text-white">
        <div className="text-center">
          <p className="font-display text-[22px] tracking-tight">
            Category not found.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-4 font-mono text-[11px] tracking-[0.18em] text-white/60 underline"
          >
            HOME
          </button>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICON[category.id];

  return (
    <div className="min-h-screen bg-vault pb-36 text-white">
      <header className="animate-reveal px-6 pt-12 pb-8">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-white/60 backdrop-blur transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3" strokeWidth={2} />
          BACK
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.22em] text-blue">
              {String(catItems.length).padStart(2, "0")} HELD
            </p>
            <h1 className="mt-2 font-display text-[36px] leading-none tracking-tight text-white">
              {category.name}
            </h1>
            <p className="mt-2 text-[13px] text-white/50">
              {category.subtitle}
            </p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl glass">
            <Icon className="size-6 text-white/70" strokeWidth={1.4} />
          </div>
        </div>
      </header>

      {/* Items */}
      <section className="animate-reveal px-6" style={{ animationDelay: "80ms" }}>
        {catItems.length === 0 ? (
          <div className="rounded-[22px] glass p-8 text-center">
            <p className="font-display text-[22px] tracking-tight text-white">
              Nothing held here yet.
            </p>
            <p className="mt-2 font-mono text-[11px] tracking-[0.18em] text-white/45">
              SET IT ONCE · TIAKI REMEMBERS
            </p>
            <button
              onClick={() => setSheetOpen(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 font-mono text-[11px] tracking-[0.18em] text-primary-foreground"
              style={{
                background: "linear-gradient(180deg, #a8c5ff, #5a8dff)",
                boxShadow: "0 6px 16px -6px rgba(126,169,255,0.55)",
              }}
            >
              <Plus className="size-3.5" strokeWidth={2.25} />
              PROTECT SOMETHING
            </button>
          </div>
        ) : (
          <>
            <p className="mb-3 font-mono text-[10px] tracking-[0.22em] text-white/40">
              SWIPE LEFT TO REMOVE
            </p>
            <ul className="space-y-2">
              <AnimatePresence initial={false}>
                {catItems.map((item) => {
                  const status = statusForDate(item.dueDate);
                  const accent =
                    status === "attention"
                      ? "text-[color:var(--clay)]"
                      : status === "soon"
                        ? "text-blue"
                        : "text-white/40";
                  const dot =
                    status === "attention"
                      ? "bg-[color:var(--clay)]"
                      : status === "soon"
                        ? "bg-[color:var(--sea-500)]"
                        : "bg-white/15";
                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -80, transition: { duration: 0.2 } }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <SwipeItem onDelete={() => deleteItem(item.id)}>
                        <div className="rounded-2xl glass px-4 py-4">
                          <div className="mb-1.5 flex items-center gap-2">
                            <span className={`size-1.5 rounded-full ${dot}`} />
                            <span
                              className={`font-mono text-[10px] tracking-[0.18em] ${accent}`}
                            >
                              {formatDueLabel(item.dueDate).toUpperCase()}
                            </span>
                          </div>
                          <p className="text-[16px] font-medium tracking-tight text-white">
                            {item.title}
                          </p>
                          {item.notes && (
                            <p className="mt-1 line-clamp-2 text-[13px] text-white/55">
                              {item.notes}
                            </p>
                          )}
                        </div>
                      </SwipeItem>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </>
        )}
      </section>

      <ProtectSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        defaultCategory={category.id}
      />

      <BottomNav />
    </div>
  );
}
