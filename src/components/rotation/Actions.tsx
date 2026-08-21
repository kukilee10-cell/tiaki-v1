import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import {
  DOC_TYPES,
  addDoc,
  addProduct,
  generateSku,
  knownCategories,
  knownDestinations,
  knownLocations,
  knownSuppliers,
  landedUnitCost,
  money,
  suggestCategory,
  today,
  type DocType,
} from "@/lib/stock-storage";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6">
      <div className="max-h-[92vh] w-full max-w-md overflow-y-auto border border-steel-700 bg-steel-900">
        <div className="hazard-bar sticky top-0 h-[3px] w-full" />
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

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label-industrial">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export const inputCls =
  "w-full panel-recessed px-3 py-3 font-mono text-[13px] text-foreground outline-none focus:border-hivis";

export function SubmitBar({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="mt-4 w-full rounded-[3px] bg-hivis px-4 py-3.5 font-mono text-[11px] uppercase tracking-[0.16em] text-primary-foreground active:opacity-80"
    >
      {label}
    </button>
  );
}

export function Chips({
  options,
  onPick,
}: {
  options: string[];
  onPick: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.slice(0, 8).map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onPick(o)}
          className="rounded-[2px] border border-steel-700 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-steel-400 active:border-hivis active:text-hivis"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/** Big new-item form with auto SKU, auto category and auto landed cost. */
export function ItemForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [skuTouched, setSkuTouched] = useState(false);
  const [category, setCategory] = useState("Other");
  const [catTouched, setCatTouched] = useState(false);
  const [qty, setQty] = useState("");
  const [supplier, setSupplier] = useState("");
  const [destination, setDestination] = useState("");
  const [location, setLocation] = useState("");
  const [productCost, setProductCost] = useState("");
  const [freightCost, setFreightCost] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [lowLevel, setLowLevel] = useState("");
  const [receivedAt, setReceivedAt] = useState(today());
  const [notes, setNotes] = useState("");

  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [destinations, setDestinations] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setSuppliers(knownSuppliers());
    setDestinations(knownDestinations());
    setLocations(knownLocations());
    setCategories(knownCategories());
  }, []);

  useEffect(() => {
    if (!name.trim()) return;
    const cat = catTouched ? category : suggestCategory(name);
    if (!catTouched) setCategory(cat);
    if (!skuTouched) setSku(generateSku(name, cat));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, catTouched, category]);

  const q = Number(qty) || 0;
  const landed = landedUnitCost(Number(productCost) || 0, Number(freightCost) || 0, q);
  const sell = Number(sellPrice) || 0;
  const profit = sell > 0 ? sell - landed : 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addProduct({
          name: name.trim(),
          sku: (sku || generateSku(name, category)).toUpperCase(),
          category: category || "Other",
          qty: q,
          supplier: supplier.trim(),
          destination: destination.trim(),
          location: location.trim(),
          productCost: Number(productCost) || 0,
          freightCost: Number(freightCost) || 0,
          sellPrice: sell,
          lowLevel: Number(lowLevel) || 0,
          receivedAt,
          notes: notes.trim() || undefined,
        });
        onDone();
      }}
      className="space-y-3.5"
    >
      <Field label="Product name">
        <input
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="UGREEN 130W Car Charger"
          autoFocus
        />
      </Field>

      <Field label="SKU (auto)">
        <input
          className={inputCls}
          value={sku}
          onChange={(e) => {
            setSkuTouched(true);
            setSku(e.target.value.toUpperCase());
          }}
          placeholder="AUTO"
        />
      </Field>

      <Field label="Category (auto suggested)">
        <select
          className={inputCls}
          value={category}
          onChange={(e) => {
            setCatTouched(true);
            setCategory(e.target.value);
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Quantity received">
        <input
          className={inputCls}
          type="number"
          inputMode="numeric"
          min="0"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="50"
        />
      </Field>

      <Field label="Supplier / source">
        <input
          className={inputCls}
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Alibaba"
        />
      </Field>
      <Chips options={suppliers} onPick={setSupplier} />

      <Field label="Destination">
        <input
          className={inputCls}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Rotation Co."
        />
      </Field>
      <Chips options={destinations} onPick={setDestination} />

      <Field label="Storage location">
        <input
          className={inputCls}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Shelf A"
        />
      </Field>
      <Chips options={locations} onPick={setLocation} />

      <div className="grid grid-cols-2 gap-2">
        <Field label="Total product cost">
          <input
            className={inputCls}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={productCost}
            onChange={(e) => setProductCost(e.target.value)}
            placeholder="400"
          />
        </Field>
        <Field label="Freight cost">
          <input
            className={inputCls}
            type="number"
            inputMode="decimal"
            step="0.01"
            value={freightCost}
            onChange={(e) => setFreightCost(e.target.value)}
            placeholder="100"
          />
        </Field>
      </div>

      <div className="panel-recessed grid grid-cols-2 gap-2 px-3 py-3">
        <div>
          <p className="label-industrial">Landed cost / item</p>
          <p className="num-xl mt-1 text-[20px] text-hivis">{money(landed)}</p>
        </div>
        <div>
          <p className="label-industrial">Profit / item</p>
          <p
            className="num-xl mt-1 text-[20px]"
            style={{ color: profit >= 0 ? "var(--ok)" : "var(--crit)" }}
          >
            {sell > 0 ? money(profit) : "—"}
          </p>
        </div>
      </div>

      <Field label="Selling price (optional)">
        <input
          className={inputCls}
          type="number"
          inputMode="decimal"
          step="0.01"
          value={sellPrice}
          onChange={(e) => setSellPrice(e.target.value)}
          placeholder="19.99"
        />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Date received">
          <input
            className={inputCls}
            type="date"
            value={receivedAt}
            onChange={(e) => setReceivedAt(e.target.value)}
          />
        </Field>
        <Field label="Low stock level">
          <input
            className={inputCls}
            type="number"
            inputMode="numeric"
            min="0"
            value={lowLevel}
            onChange={(e) => setLowLevel(e.target.value)}
            placeholder="5"
          />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea
          className={inputCls}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </Field>

      <SubmitBar label="Save Item" />
    </form>
  );
}

export function DocForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocType>("delivery_docket");
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(today());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        addDoc({ title: title.trim(), type, ref: ref.trim() || undefined, date });
        onDone();
      }}
      className="space-y-3"
    >
      <Field label="Title">
        <input
          className={inputCls}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Alibaba invoice"
        />
      </Field>
      <Field label="Type">
        <select
          className={inputCls}
          value={type}
          onChange={(e) => setType(e.target.value as DocType)}
        >
          {DOC_TYPES.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Reference (optional)">
        <input className={inputCls} value={ref} onChange={(e) => setRef(e.target.value)} />
      </Field>
      <Field label="Date">
        <input
          className={inputCls}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <SubmitBar label="File Document" />
    </form>
  );
}
