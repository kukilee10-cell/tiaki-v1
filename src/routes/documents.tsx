import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Screen, SectionTitle } from "@/components/rotation/Chrome";
import { DocForm, Modal } from "@/components/rotation/Actions";
import { useDocs } from "@/hooks/use-stock";
import { DOC_TYPES, deleteDoc } from "@/lib/stock-storage";

export const Route = createFileRoute("/documents")({
  head: () => ({
    meta: [
      { title: "Dockets & Documents — Rotation Co." },
      {
        name: "description",
        content:
          "Delivery dockets, invoices, supplier quotes and purchase orders filed against the Rotation Co. warehouse.",
      },
      { property: "og:title", content: "Dockets & Documents — Rotation Co." },
      {
        property: "og:description",
        content: "Paperwork store for dockets, invoices, quotes and purchase orders.",
      },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const docs = useDocs()
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const [open, setOpen] = useState(false);
  const labelFor = (t: string) => DOC_TYPES.find((d) => d.id === t)?.label ?? "OTHER";

  return (
    <Screen sub="Dockets & Documents">
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-hivis px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground active:opacity-80"
      >
        <Plus className="size-4" /> File Document
      </button>

      <div className="mt-5">
        <SectionTitle>Filed Paperwork</SectionTitle>
        {docs.length === 0 ? (
          <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
            NO DOCUMENTS FILED.
          </p>
        ) : (
          <div className="panel divide-y divide-steel-700">
            {docs.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-3 py-3">
                <FileText className="size-4 shrink-0 text-hivis" strokeWidth={1.9} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{d.title}</p>
                  <p className="label-industrial mt-0.5">
                    {labelFor(d.type)} · {d.date}
                    {d.ref ? ` · ${d.ref}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => deleteDoc(d.id)}
                  aria-label={`Delete ${d.title}`}
                  className="text-steel-400 active:text-crit"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} title="File Document" onClose={() => setOpen(false)}>
        <DocForm onDone={() => setOpen(false)} />
      </Modal>
    </Screen>
  );
}
