// ROTATION CO. — WAREHOUSE & INVENTORY
// Offline-first local store. No cloud, no auth. Everything in localStorage.

export type MovementType = "received" | "sold" | "sample" | "adjust";

export interface Product {
  id: string;
  name: string;
  sku: string;
  unitCost: number;
  sellPrice: number;
  onHand: number;
  reorderPoint: number;
  bin?: string;
  createdAt: string;
}

export interface Movement {
  id: string;
  productId: string;
  type: MovementType;
  qty: number; // signed
  ref?: string;
  at: string; // ISO
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

const PRODUCTS_KEY = "rotation.stock.products.v2";
const MOVES_KEY = "rotation.stock.movements.v2";
const DOCS_KEY = "rotation.stock.docs.v2";

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

export function addProduct(
  p: Omit<Product, "id" | "createdAt" | "onHand"> & { onHand?: number },
): Product {
  const product: Product = {
    ...p,
    onHand: p.onHand ?? 0,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const rows = loadProducts();
  rows.push(product);
  write(PRODUCTS_KEY, rows);
  if (product.onHand > 0) {
    logMovement(product.id, "received", product.onHand, "OPENING BALANCE");
  }
  return product;
}

export function updateProduct(id: string, patch: Partial<Product>) {
  write(
    PRODUCTS_KEY,
    loadProducts().map((p) => (p.id === id ? { ...p, ...patch } : p)),
  );
}

export function deleteProduct(id: string) {
  write(
    PRODUCTS_KEY,
    loadProducts().filter((p) => p.id !== id),
  );
}

function logMovement(
  productId: string,
  type: MovementType,
  qty: number,
  ref?: string,
) {
  const rows = loadMovements();
  rows.push({
    id: crypto.randomUUID(),
    productId,
    type,
    qty,
    ref,
    at: new Date().toISOString(),
  });
  write(MOVES_KEY, rows);
}

/** Apply a signed stock movement and keep on-hand in sync. */
export function applyMovement(
  productId: string,
  type: MovementType,
  qty: number,
  ref?: string,
) {
  const products = loadProducts();
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  const signed =
    type === "received" ? Math.abs(qty) : type === "adjust" ? qty : -Math.abs(qty);
  product.onHand = Math.max(0, product.onHand + signed);
  write(PRODUCTS_KEY, products);
  logMovement(productId, type, signed, ref);
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

// ---- derived -------------------------------------------------------------

export type StockStatus = "in_stock" | "low" | "out";

export function statusFor(p: Product): StockStatus {
  if (p.onHand <= 0) return "out";
  if (p.onHand <= p.reorderPoint) return "low";
  return "in_stock";
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "IN STOCK",
  low: "LOW STOCK",
  out: "OUT OF STOCK",
};

export function money(n: number) {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function totals(products: Product[]) {
  return {
    units: products.reduce((s, p) => s + p.onHand, 0),
    value: products.reduce((s, p) => s + p.onHand * p.unitCost, 0),
    revenue: products.reduce((s, p) => s + p.onHand * p.sellPrice, 0),
    low: products.filter((p) => statusFor(p) !== "in_stock").length,
  };
}
