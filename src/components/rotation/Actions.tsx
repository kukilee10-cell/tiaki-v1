import { useState, type ReactNode } from "react";
import {
  PackagePlus,
  ScanLine,
  Receipt,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  addDoc,
  addProduct,
  applyMovement,
  DOC_TYPES,
  loadProducts,
  type DocType,
} from "@/lib/stock-storage";
import { useProducts } from "@/hooks/use-stock";

type ActionId = "receive" | "sale" | "product" | "scan" | null;

export function QuickActions() {
  const [open, setOpen] = useState<ActionId>(null);
  const actions: { id: Exclude<ActionId, null>; label: string; Icon: LucideIcon }[] = [
    { id: "receive", label: "Receive", Icon: PackagePlus },
    { id: "sale", label: "Sell", Icon: Receipt },
    { id: "product", label: "Add", Icon: Plus },
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {actions.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setOpen(id)}
            className="panel-raised flex flex-col items-center gap-1.5 px-2 py-3.5 transition-colors active:bg-steel-800"
          >
            <Icon className="size-5 text-hivis" strokeWidth={2} />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em]">
              {label}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={() => setOpen("scan")}
        className="mt-2 flex w-full items-center justify-center gap-2 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-steel-400 active:text-hivis"
      >
        <ScanLine className="size-3.5" strokeWidth={2} />
        Scan Document
      </button>


      <Modal
        open={open === "receive"}
        title="Receive Stock"
        onClose={() => setOpen(null)}
      >
        <MovementForm kind="received" onDone={() => setOpen(null)} />
      </Modal>
      <Modal open={open === "sale"} title="Record Sale" onClose={() => setOpen(null)}>
        <MovementForm kind="sold" onDone={() => setOpen(null)} />
      </Modal>
      <Modal
        open={open === "product"}
        title="New Product"
        onClose={() => setOpen(null)}
      >
        <ProductForm onDone={() => setOpen(null)} />
      </Modal>
      <Modal
        open={open === "scan"}
        title="Scan Document"
        onClose={() => setOpen(null)}
      >
        <DocForm onDone={() => setOpen(null)} />
      </Modal>
    </>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-6">
      <div className="w-full max-w-md border border-steel-700 bg-steel-900">
        <div className="hazard-bar h-[3px] w-full" />
        <div className="flex items-center justify-between border-b border-steel-700 px-4 py-3">
          <h3 className="font-display text-[15px] font-semibold uppercase tracking-[0.08em]">
            {title}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-steel-400">
            <X className="size-4" />
          </button>
        </div>
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-industrial">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full panel-recessed px-3 py-2.5 font-mono text-[13px] text-foreground outline-none focus:border-hivis";

export function SubmitBar({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="mt-4 w-full rounded-[3px] bg-hivis px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground active:opacity-80"
    >
      {label}
    </button>
  );
}

function MovementForm({
  kind,
  onDone,
}: {
  kind: "received" | "sold";
  onDone: () => void;
}) {
  const products = useProducts();
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("1");
  const [ref, setRef] = useState("");

  if (products.length === 0) {
    return (
      <p className="font-mono text-[11px] text-steel-400">
        NO PRODUCTS ON FILE — CREATE A PRODUCT FIRST.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const id = productId || products[0].id;
        applyMovement(id, kind, Number(qty) || 0, ref.toUpperCase() || undefined);
        onDone();
      }}
      className="space-y-3"
    >
      <Field label="Product">
        <select
          className={inputCls}
          value={productId || products[0].id}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} — {p.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Quantity">
        <input
          className={inputCls}
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
      </Field>
      <Field label={kind === "received" ? "PO / Docket ref" : "Invoice ref"}>
        <input
          className={inputCls}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder={kind === "received" ? "PO-1063" : "INV-3350"}
        />
      </Field>
      <SubmitBar label={kind === "received" ? "Post Receipt" : "Post Sale"} />
    </form>
  );
}

function ProductForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [unitCost, setUnitCost] = useState("0");
  const [sellPrice, setSellPrice] = useState("0");
  const [onHand, setOnHand] = useState("0");
  const [reorderPoint, setReorderPoint] = useState("10");
  const [bin, setBin] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addProduct({
          name: name.trim(),
          sku:
            sku.trim().toUpperCase() ||
            `ROT-${String(loadProducts().length + 1).padStart(3, "0")}`,
          unitCost: Number(unitCost) || 0,
          sellPrice: Number(sellPrice) || 0,
          onHand: Number(onHand) || 0,
          reorderPoint: Number(reorderPoint) || 0,
          bin: bin.trim().toUpperCase() || undefined,
        });
        onDone();
      }}
      className="space-y-3"
    >
      <Field label="Description">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hi-Vis Work Cap"
        />
      </Field>
      <Field label="SKU">
        <input
          className={inputCls}
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="ROT-CAP-014"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Unit cost">
          <input
            className={inputCls}
            type="number"
            step="0.01"
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </Field>
        <Field label="Sell price">
          <input
            className={inputCls}
            type="number"
            step="0.01"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
          />
        </Field>
        <Field label="Opening qty">
          <input
            className={inputCls}
            type="number"
            value={onHand}
            onChange={(e) => setOnHand(e.target.value)}
          />
        </Field>
        <Field label="Reorder point">
          <input
            className={inputCls}
            type="number"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Bin location">
        <input
          className={inputCls}
          value={bin}
          onChange={(e) => setBin(e.target.value)}
          placeholder="A-01"
        />
      </Field>
      <SubmitBar label="Create Product" />
    </form>
  );
}

export function DocForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocType>("delivery_docket");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        addDoc({
          title: title.trim(),
          type,
          ref: ref.trim().toUpperCase() || undefined,
          date,
        });
        onDone();
      }}
      className="space-y-3"
    >
      <Field label="Document title">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Northline delivery docket"
        />
      </Field>
      <Field label="Type">
        <select
          className={inputCls}
          value={type}
          onChange={(e) => setType(e.target.value as DocType)}
        >
          {DOC_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Reference">
          <input
            className={inputCls}
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="DKT-8842"
          />
        </Field>
        <Field label="Date">
          <input
            className={inputCls}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
      </div>
      <SubmitBar label="File Document" />
    </form>
  );
}
