// Offline-first local storage for TIAKI.
// V1: no cloud, no auth. Everything lives in localStorage.

export type CategoryId =
  | "documents"
  | "vehicles"
  | "home"
  | "travel"
  | "family"
  | "pets"
  | "reminders"
  | "maintenance"
  | "personal";

export interface TiakiItem {
  id: string;
  categoryId: CategoryId;
  title: string;
  dueDate?: string; // ISO yyyy-mm-dd
  notes?: string;
  createdAt: string;
}

export interface TiakiProfile {
  name: string;
}

const ITEMS_KEY = "tiaki.items.v1";
const PROFILE_KEY = "tiaki.profile.v1";

export const CATEGORIES: {
  id: CategoryId;
  name: string;
  subtitle: string;
}[] = [
  { id: "vehicles", name: "Vehicles", subtitle: "Registration & service" },
  { id: "documents", name: "Documents", subtitle: "IDs & records" },
  { id: "home", name: "Home", subtitle: "Utilities & upkeep" },
  { id: "travel", name: "Travel", subtitle: "Passports & trips" },
  { id: "family", name: "Family", subtitle: "People & health" },
  { id: "pets", name: "Pets", subtitle: "Care & vaccines" },
  { id: "reminders", name: "Reminders", subtitle: "Everyday nudges" },
  { id: "maintenance", name: "Maintenance", subtitle: "Recurring tasks" },
  { id: "personal", name: "Personal", subtitle: "Private records" },
];

export function getCategory(id: CategoryId) {
  return CATEGORIES.find((c) => c.id === id);
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadItems(): TiakiItem[] {
  if (typeof window === "undefined") return [];
  return safeParse<TiakiItem[]>(localStorage.getItem(ITEMS_KEY), []);
}

export function saveItems(items: TiakiItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("tiaki:items-changed"));
}

export function addItem(item: Omit<TiakiItem, "id" | "createdAt">): TiakiItem {
  const now = new Date().toISOString();
  const created: TiakiItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: now,
  };
  const items = loadItems();
  items.push(created);
  saveItems(items);
  scheduleReminder(created);
  return created;
}

export function updateItem(id: string, patch: Partial<TiakiItem>) {
  const items = loadItems().map((i) => (i.id === id ? { ...i, ...patch } : i));
  saveItems(items);
  const updated = items.find((i) => i.id === id);
  if (updated) scheduleReminder(updated);
}

export function deleteItem(id: string) {
  saveItems(loadItems().filter((i) => i.id !== id));
}

export function loadProfile(): TiakiProfile {
  if (typeof window === "undefined") return { name: "friend" };
  return safeParse<TiakiProfile>(localStorage.getItem(PROFILE_KEY), {
    name: "friend",
  });
}

export function saveProfile(profile: TiakiProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent("tiaki:profile-changed"));
}

export type Status = "attention" | "soon" | "good";

export function statusForDate(dueDate?: string, today = new Date()): Status {
  if (!dueDate) return "good";
  const due = new Date(dueDate + "T00:00:00");
  const diffDays = Math.floor(
    (due.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 14) return "attention";
  if (diffDays <= 45) return "soon";
  return "good";
}

export function daysUntil(dueDate: string, today = new Date()): number {
  const due = new Date(dueDate + "T00:00:00");
  return Math.floor(
    (due.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
  );
}

export function formatDueLabel(dueDate?: string): string {
  if (!dueDate) return "No date";
  const d = daysUntil(dueDate);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return "Today";
  if (d === 1) return "Tomorrow";
  if (d < 30) return `In ${d} days`;
  if (d < 60) return `In ${Math.round(d / 7)} weeks`;
  return `In ${Math.round(d / 30)} months`;
}

/**
 * Local browser notifications only. No push server, no cloud.
 * Best-effort: browsers close tabs so this is a nice-to-have on web;
 * the real reminder engine lands with the native shell later.
 */
function scheduleReminder(item: TiakiItem) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (!item.dueDate) return;
  if (Notification.permission !== "granted") return;
  const due = new Date(item.dueDate + "T09:00:00").getTime();
  const ms = due - Date.now();
  if (ms <= 0 || ms > 2_147_000_000) return;
  window.setTimeout(() => {
    new Notification("Tiaki reminder", {
      body: `${item.title} is due today`,
      silent: false,
    });
  }, ms);
}

export function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}
