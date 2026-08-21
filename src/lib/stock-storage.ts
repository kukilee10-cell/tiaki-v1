// ROTATION CO. — WAREHOUSE & INVENTORY
// Offline-first local store. No cloud, no auth. Everything in localStorage.

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  qty: number;
  supplier: string;
  destination: string;
  location: string;
  productCost: number; // total paid for the products
  freightCost: number; // total freight for that order
  landedUnit: number; // landed cost per item
  sellPrice: number; // 0 = not set
  lowLevel: number;
  receivedAt: string; // YYYY-MM-DD
  updatedAt: string; // ISO
  notes?: string;
  createdAt: string;
}

export type MoveDir = "in" | "out";

export interface Movement {
  id: string;
  ref: string; // MOV-001
  productId: string;
  dir: MoveDir;
  qty: number;
  date: string; // YYYY-MM-DD
  party?: string; // supplier (in) or destination (out)
  reason?: string;
  notes?: string;
  balance: number; // qty after movement
}

export type DocType =
  | "invoice"
  | "receipt"
  | "delivery_docket"
  | "supplier_quote"
  | "purchase_order"
  | "freight"
  | "other";

export interface StockDoc {
  id: string;
  title: string;
  type: DocType;
  ref?: string;
  date: string;
}

export const DOC_TYPES: { id: DocType; label: string }[] = [
  { id: "invoice", label: "INVOICE" },
  { id: "receipt", label: "RECEIPT" },
  { id: "delivery_docket", label: "DELIVERY DOCKET" },
  { id: "supplier_quote", label: "SUPPLIER QUOTE" },
  { id: "purchase_order", label: "PURCHASE ORDER" },
  { id: "freight", label: "FREIGHT" },
  { id: "other", label: "OTHER" },
];

export const CATEGORIES = [
  "Chargers",
  "Cables",
  "Starlink",
  "Stickers",
  "Air Fresheners",
  "Hats",
  "Clothing",
  "Packaging",
  "Other",
];

export const LOCATIONS = [
  "Home",
  "Garage",
  "Shelf A",
  "Shelf B",
  "Box 1",
  "Vehicle",
  "Other",
];

const PRODUCTS_KEY = "rotation.stock.products.v3";
const MOVES_KEY = "rotation.stock.movements.v3";
const DOCS_KEY = "rotation.stock.docs.v2";
const SEQ_KEY = "rotation.stock.moveseq.v1";

export const CHANGED_EVENT = "rotation:stock-changed";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  return safeParse<T[]>(localStorage.getItem(key), []);
}

function write<T>(key: string, rows: T[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(CHANGED_EVENT));
}

export const loadProducts = () => read<Product>(PRODUCTS_KEY);
export const loadMovements = () => read<Movement>(MOVES_KEY);
export const loadDocs = () => read<StockDoc>(DOCS_KEY);

export function today(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ---- SKU + category intelligence ------------------------------------------

const STOP = new Set([
  "the",
  "and",
  "for",
  "with",
  "pack",
  "of",
  "a",
  "in",
  "co",
]);

const CATEGORY_HINTS: { match: RegExp; category: string; tag: string }[] = [
  { match: /charger|charging|adapter|power bank/i, category: "Chargers", tag: "CHG" },
  { match: /cable|cord|lead|usb-?c|lightning/i, category: "Cables", tag: "CBL" },
  { match: /starlink|dish|router/i, category: "Starlink", tag: "STL" },
  { match: /sticker|decal/i, category: "Stickers", tag: "STK" },
  { match: /air ?fresh|freshener|scent/i, category: "Air Fresheners", tag: "AF" },
  { match: /hat|cap|beanie/i, category: "Hats", tag: "HAT" },
  { match: /shirt|tee|hoodie|jacket|clothing|apparel/i, category: "Clothing", tag: "CLO" },
  { match: /box|bag|packag|mailer|tape/i, category: "Packaging", tag: "PKG" },
];

export function suggestCategory(name: string): string {
  const hit = CATEGORY_HINTS.find((h) => h.match.test(name));
  return hit ? hit.category : "Other";
}

function words(name: string): string[] {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w.toLowerCase()));
}

/** UGR-UGREEN-001 style, guaranteed unique. */
export function generateSku(name: string, category?: string): string {
  const w = words(name);
  if (w.length === 0) return "SKU-001";
  const brand = w[0].slice(0, 3).toUpperCase();
  const hint = CATEGORY_HINTS.find((h) => h.match.test(name));
  let mid: string;
  if (hint) mid = hint.tag;
  else if (w.length > 1) mid = w.slice(1).map((x) => x[0]).join("").slice(0, 3).toUpperCase();
  else mid = w[0].slice(0, 6).toUpperCase();
  if (!hint && category && category !== "Other" && mid.length < 2) {
    mid = category.slice(0, 3).toUpperCase();
  }
  const prefix = `${brand}-${mid}`;
  const existing = loadProducts()
    .map((p) => p.sku.toUpperCase())
    .filter((s) => s.startsWith(`${prefix}-`));
  let n = 1;
  const used = new Set(
    existing.map((s) => Number(s.split("-").pop()) || 0),
  );
  while (used.has(n)) n += 1;
  return `${prefix}-${String(n).padStart(3, "0")}`;
}

function nextMoveRef(): string {
  if (typeof window === "undefined") return "MOV-001";
  const current = Number(localStorage.getItem(SEQ_KEY) ?? "0") + 1;
  localStorage.setItem(SEQ_KEY, String(current));
  return `MOV-${String(current).padStart(3, "0")}`;
}

// ---- suggestions (remembered values) --------------------------------------

function distinct(values: (string | undefined)[]): string[] {
  return Array.from(
    new Set(values.map((v) => (v ?? "").trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function knownSuppliers(): string[] {
  return distinct([
    ...loadProducts().map((p) => p.supplier),
    ...loadMovements().filter((m) => m.dir === "in").map((m) => m.party),
  ]);
}

export function knownDestinations(): string[] {
  return distinct([
    ...loadProducts().map((p) => p.destination),
    ...loadMovements().filter((m) => m.dir === "out").map((m) => m.party),
  ]);
}

export function knownLocations(): string[] {
  return distinct([...LOCATIONS, ...loadProducts().map((p) => p.location)]);
}

export function knownCategories(): string[] {
  return distinct([...CATEGORIES, ...loadProducts().map((p) => p.category)]);
}

// ---- maths -----------------------------------------------------------------

export function landedUnitCost(
  productCost: number,
  freightCost: number,
  qty: number,
) {
  const total = (productCost || 0) + (freightCost || 0);
  if (!qty || qty <= 0) return 0;
  return total / qty;
}

export const profitPerItem = (p: Product) =>
  p.sellPrice > 0 ? p.sellPrice - p.landedUnit : 0;
export const stockValue = (p: Product) => p.qty * p.landedUnit;
export const potentialSales = (p: Product) => p.qty * p.sellPrice;
export const potentialProfit = (p: Product) => p.qty * profitPerItem(p);

export type StockStatus = "in_stock" | "low" | "out";

export function statusFor(p: Product): StockStatus {
  if (p.qty <= 0) return "out";
  if (p.lowLevel > 0 && p.qty <= p.lowLevel) return "low";
  return "in_stock";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "IN STOCK",
  low: "LOW STOCK",
  out: "OUT OF STOCK",
};

export function money(n: number) {
  return `$${(n || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function totals(products: Product[]) {
  return {
    products: products.length,
    units: products.reduce((s, p) => s + p.qty, 0),
    value: products.reduce((s, p) => s + stockValue(p), 0),
    sales: products.reduce((s, p) => s + potentialSales(p), 0),
    profit: products.reduce((s, p) => s + potentialProfit(p), 0),
    low: products.filter((p) => statusFor(p) !== "in_stock").length,
  };
}

// ---- mutations -------------------------------------------------------------

export type NewProductInput = Omit<
  Product,
  "id" | "createdAt" | "updatedAt" | "landedUnit"
>;

export function addProduct(input: NewProductInput): Product {
  const product: Product = {
    ...input,
    landedUnit: landedUnitCost(input.productCost, input.freightCost, input.qty),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  write(PRODUCTS_KEY, [...loadProducts(), product]);
  if (product.qty > 0) {
    recordMovement({
      productId: product.id,
      dir: "in",
      qty: product.qty,
      date: product.receivedAt,
      party: product.supplier,
      reason: "Opening stock",
    });
  }
  return product;
}

export function updateProduct(id: string, patch: Partial<Product>) {
  write(
    PRODUCTS_KEY,
    loadProducts().map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
    ),
  );
}

export function deleteProduct(id: string) {
  write(
    PRODUCTS_KEY,
    loadProducts().filter((p) => p.id !== id),
  );
  write(
    MOVES_KEY,
    loadMovements().filter((m) => m.productId !== id),
  );
}

function recordMovement(input: {
  productId: string;
  dir: MoveDir;
  qty: number;
  date: string;
  party?: string;
  reason?: string;
  notes?: string;
}) {
  const product = loadProducts().find((p) => p.id === input.productId);
  const move: Movement = {
    id: crypto.randomUUID(),
    ref: nextMoveRef(),
    balance: product?.qty ?? 0,
    ...input,
  };
  write(MOVES_KEY, [...loadMovements(), move]);
  return move;
}

/** Stock In: adds units and optionally re-averages landed cost. */
export function stockIn(
  productId: string,
  input: {
    qty: number;
    date: string;
    party?: string;
    productCost?: number;
    freightCost?: number;
    notes?: string;
  },
) {
  const products = loadProducts();
  const p = products.find((x) => x.id === productId);
  if (!p) return;
  const qty = Math.abs(input.qty) || 0;
  const addCost = (input.productCost || 0) + (input.freightCost || 0);
  const newQty = p.qty + qty;
  const landedUnit =
    addCost > 0 && qty > 0
      ? (p.qty * p.landedUnit + addCost) / (newQty || 1)
      : p.landedUnit;
  updateProduct(productId, {
    qty: newQty,
    landedUnit,
    productCost: p.productCost + (input.productCost || 0),
    freightCost: p.freightCost + (input.freightCost || 0),
    supplier: input.party?.trim() || p.supplier,
  });
  recordMovement({
    productId,
    dir: "in",
    qty,
    date: input.date,
    party: input.party,
    notes: input.notes,
  });
}

export function stockOut(
  productId: string,
  input: {
    qty: number;
    date: string;
    party?: string;
    reason?: string;
    notes?: string;
  },
) {
  const p = loadProducts().find((x) => x.id === productId);
  if (!p) return;
  const qty = Math.abs(input.qty) || 0;
  updateProduct(productId, {
    qty: Math.max(0, p.qty - qty),
    destination: input.party?.trim() || p.destination,
  });
  recordMovement({
    productId,
    dir: "out",
    qty,
    date: input.date,
    party: input.party,
    reason: input.reason,
    notes: input.notes,
  });
}

export function addDoc(doc: Omit<StockDoc, "id">): StockDoc {
  const created = { ...doc, id: crypto.randomUUID() };
  write(DOCS_KEY, [...loadDocs(), created]);
  return created;
}

export function deleteDoc(id: string) {
  write(
    DOCS_KEY,
    loadDocs().filter((d) => d.id !== id),
  );
}
