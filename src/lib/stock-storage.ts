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

export type InboundStatus =
  | "ordered"
  | "shipped"
  | "in_transit"
  | "partial"
  | "received";

export interface InboundLine {
  productId: string;
  qtyOrdered: number;
  qtyReceived: number;
}

export interface InboundOrder {
  id: string;
  ref: string;
  supplier: string;
  status: InboundStatus;
  eta?: string;
  lines: InboundLine[];
  createdAt: string;
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

export const INBOUND_STATUS_LABEL: Record<InboundStatus, string> = {
  ordered: "ORDERED",
  shipped: "SHIPPED",
  in_transit: "IN TRANSIT",
  partial: "PARTIALLY RECEIVED",
  received: "RECEIVED",
};

const PRODUCTS_KEY = "rotation.stock.products.v1";
const MOVES_KEY = "rotation.stock.movements.v1";
const INBOUND_KEY = "rotation.stock.inbound.v1";
const DOCS_KEY = "rotation.stock.docs.v1";
const SEED_KEY = "rotation.stock.seeded.v1";

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
export const loadInbound = () => read<InboundOrder>(INBOUND_KEY);
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

export function deleteInbound(id: string) {
  write(
    INBOUND_KEY,
    loadInbound().filter((o) => o.id !== id),
  );
}

export function newInbound(
  data: Omit<InboundOrder, "id" | "createdAt">,
): InboundOrder {
  const order: InboundOrder = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  write(INBOUND_KEY, [...loadInbound(), order]);
  return order;
}

export function saveInbound(order: InboundOrder) {
  const rows = loadInbound();
  const i = rows.findIndex((o) => o.id === order.id);
  if (i >= 0) rows[i] = order;
  else rows.push(order);
  write(INBOUND_KEY, rows);
}

/** Receive quantities against an inbound order and post movements. */
export function receiveDelivery(
  orderId: string,
  received: Record<string, number>,
) {
  const order = loadInbound().find((o) => o.id === orderId);
  if (!order) return;
  for (const line of order.lines) {
    const qty = received[line.productId] ?? 0;
    if (qty > 0) {
      line.qtyReceived += qty;
      applyMovement(line.productId, "received", qty, order.ref);
    }
  }
  const complete = order.lines.every((l) => l.qtyReceived >= l.qtyOrdered);
  const any = order.lines.some((l) => l.qtyReceived > 0);
  order.status = complete ? "received" : any ? "partial" : order.status;
  saveInbound(order);
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

// ---- demo seed -----------------------------------------------------------

export function seedIfEmpty() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEED_KEY)) return;
  localStorage.setItem(SEED_KEY, "1");
  if (loadProducts().length > 0) return;

  const now = Date.now();
  const iso = (daysAgo: number) =>
    new Date(now - daysAgo * 86400000).toISOString();

  const products: Product[] = [
    {
      id: crypto.randomUUID(),
      name: "Rotation Air Freshener",
      sku: "ROT-AF-001",
      unitCost: 3.4,
      sellPrice: 9.99,
      onHand: 47,
      reorderPoint: 20,
      bin: "A-01",
      createdAt: iso(60),
    },
    {
      id: crypto.randomUUID(),
      name: "Hi-Vis Work Cap",
      sku: "ROT-CAP-014",
      unitCost: 8.2,
      sellPrice: 24.0,
      onHand: 12,
      reorderPoint: 15,
      bin: "B-04",
      createdAt: iso(48),
    },
    {
      id: crypto.randomUUID(),
      name: "Site Water Bottle 1L",
      sku: "ROT-BTL-220",
      unitCost: 6.1,
      sellPrice: 18.5,
      onHand: 0,
      reorderPoint: 10,
      bin: "B-09",
      createdAt: iso(30),
    },
    {
      id: crypto.randomUUID(),
      name: "Heavy Duty Decal Pack",
      sku: "ROT-DCL-007",
      unitCost: 1.85,
      sellPrice: 7.5,
      onHand: 180,
      reorderPoint: 40,
      bin: "C-02",
      createdAt: iso(22),
    },
  ];
  write(PRODUCTS_KEY, products);

  const moves: Movement[] = [
    { id: crypto.randomUUID(), productId: products[0].id, type: "received", qty: 50, ref: "PO-1042", at: iso(21) },
    { id: crypto.randomUUID(), productId: products[0].id, type: "sold", qty: -2, ref: "INV-3311", at: iso(14) },
    { id: crypto.randomUUID(), productId: products[0].id, type: "sample", qty: -1, ref: "SITE DEMO", at: iso(9) },
    { id: crypto.randomUUID(), productId: products[1].id, type: "received", qty: 24, ref: "PO-1039", at: iso(30) },
    { id: crypto.randomUUID(), productId: products[1].id, type: "sold", qty: -12, ref: "INV-3288", at: iso(6) },
    { id: crypto.randomUUID(), productId: products[3].id, type: "received", qty: 200, ref: "PO-1051", at: iso(12) },
    { id: crypto.randomUUID(), productId: products[3].id, type: "sold", qty: -20, ref: "INV-3340", at: iso(2) },
  ];
  write(MOVES_KEY, moves);

  const inbound: InboundOrder[] = [
    {
      id: crypto.randomUUID(),
      ref: "PO-1063",
      supplier: "Northline Supply Co.",
      status: "in_transit",
      eta: new Date(now + 3 * 86400000).toISOString().slice(0, 10),
      lines: [
        { productId: products[2].id, qtyOrdered: 60, qtyReceived: 0 },
        { productId: products[1].id, qtyOrdered: 24, qtyReceived: 0 },
      ],
      createdAt: iso(5),
    },
    {
      id: crypto.randomUUID(),
      ref: "PO-1059",
      supplier: "Depot Freight Ltd",
      status: "partial",
      eta: new Date(now - 1 * 86400000).toISOString().slice(0, 10),
      lines: [{ productId: products[0].id, qtyOrdered: 100, qtyReceived: 40 }],
      createdAt: iso(11),
    },
    {
      id: crypto.randomUUID(),
      ref: "PO-1055",
      supplier: "Southgate Industrial",
      status: "ordered",
      lines: [{ productId: products[3].id, qtyOrdered: 500, qtyReceived: 0 }],
      createdAt: iso(2),
    },
  ];
  write(INBOUND_KEY, inbound);

  write<StockDoc>(DOCS_KEY, [
    { id: crypto.randomUUID(), title: "Northline delivery docket", type: "delivery_docket", ref: "DKT-8842", date: iso(5).slice(0, 10) },
    { id: crypto.randomUUID(), title: "Depot Freight invoice", type: "invoice", ref: "INV-2201", date: iso(11).slice(0, 10) },
    { id: crypto.randomUUID(), title: "Southgate quote — decals", type: "supplier_quote", ref: "QT-114", date: iso(2).slice(0, 10) },
  ]);
}
