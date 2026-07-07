import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { BottomNav } from "@/components/tiaki/BottomNav";
import { CATEGORY_ICON } from "@/components/tiaki/icons";
import { useTiakiItems } from "@/hooks/use-tiaki";
import {
  CATEGORIES,
  addItem,
  deleteItem,
  formatDueLabel,
  getCategory,
  requestNotificationPermission,
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
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const category = getCategory(categoryId as CategoryId);

  const catItems = useMemo(
    () =>
      items
        .filter((i) => i.categoryId === categoryId)
        .sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")),
    [items, categoryId],
  );

  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="text-center">
          <p className="font-display text-2xl italic">Category not found.</p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-4 font-mono text-xs uppercase tracking-widest text-leaf-800/60 underline"
          >
            Home
          </button>
        </div>
      </div>
    );
  }

  const Icon = CATEGORY_ICON[category.id];

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    requestNotificationPermission();
    addItem({
      categoryId: category!.id,
      title: title.trim(),
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
    });
    setTitle("");
    setDueDate("");
    setNotes("");
    setAdding(false);
  }

  return (
    <div className="min-h-screen bg-sand-50 pb-32 text-leaf-900">
      <header className="animate-reveal px-6 pt-14 pb-8">
        <button
          onClick={() => navigate({ to: "/" })}
          className="mb-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-leaf-800/60 transition-colors hover:text-leaf-900"
        >
          <ArrowLeft className="size-3" strokeWidth={2} />
          Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-leaf-800/60">
              {String(catItems.length).padStart(2, "0")} items
            </p>
            <h1 className="font-display text-5xl italic leading-none">
              {category.name}
            </h1>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-leaf-800/40">
              {category.subtitle}
            </p>
          </div>
          <Icon className="size-8 text-leaf-800/30" strokeWidth={1.25} />
        </div>
      </header>

      {/* Items list */}
      <section className="animate-reveal px-6 [animation-delay:100ms]">
        {catItems.length === 0 && !adding && (
          <div className="rounded-3xl border border-dashed border-leaf-900/10 bg-white/40 p-8 text-center">
            <p className="font-display text-2xl italic text-leaf-800">
              Nothing here yet.
            </p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-leaf-800/40">
              Set it once. Tiaki remembers.
            </p>
          </div>
        )}

        <ul className="space-y-3">
          {catItems.map((item) => {
            const status = statusForDate(item.dueDate);
            const dot =
              status === "attention"
                ? "bg-clay"
                : status === "soon"
                  ? "bg-sea-500"
                  : "bg-leaf-800/20";
            return (
              <li
                key={item.id}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-leaf-900/5 bg-white p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${dot}`} />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-leaf-800/50">
                      {formatDueLabel(item.dueDate)}
                    </span>
                  </div>
                  <p className="truncate font-display text-xl leading-tight">
                    {item.title}
                  </p>
                  {item.notes && (
                    <p className="mt-1 line-clamp-2 text-sm text-leaf-800/60">
                      {item.notes}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="shrink-0 rounded-full p-2 text-leaf-800/30 opacity-0 transition-all hover:bg-clay/10 hover:text-clay group-hover:opacity-100"
                  aria-label="Delete"
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Add form / trigger */}
      <section className="mt-6 px-6">
        {adding ? (
          <form
            onSubmit={handleAdd}
            className="animate-reveal rounded-3xl border border-leaf-900/5 bg-white p-5"
          >
            <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
              New in {category.name}
            </p>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should Tiaki look after?"
              className="w-full border-b border-leaf-900/10 bg-transparent pb-3 font-display text-2xl italic placeholder:text-leaf-800/25 focus:border-leaf-900 focus:outline-none"
            />
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
                  Due date (optional)
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-leaf-900/10 bg-sand-50 px-3 py-2 font-mono text-sm focus:border-leaf-900 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-leaf-800/40">
                  Notes (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-leaf-900/10 bg-sand-50 px-3 py-2 text-sm focus:border-leaf-900 focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-full bg-leaf-900 py-3 font-mono text-[11px] uppercase tracking-widest text-sand-50 transition-colors hover:bg-leaf-800"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="rounded-full border border-leaf-900/10 px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-leaf-800/60 transition-colors hover:bg-sand-100"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-3xl border border-dashed border-leaf-900/15 bg-transparent py-6 font-mono text-[11px] uppercase tracking-widest text-leaf-800/60 transition-colors hover:bg-white hover:text-leaf-900"
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Add to {category.name}
          </button>
        )}
      </section>

      <BottomNav />
    </div>
  );
}

// Small hint so the categories list is available for future filtering.
export const _categories = CATEGORIES;
// avoid unused-import lints while keeping Link import ready for future use
export const _link = Link;
