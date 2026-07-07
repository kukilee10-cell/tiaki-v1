import { useEffect, useState } from "react";
import {
  loadItems,
  loadProfile,
  type TiakiItem,
  type TiakiProfile,
} from "@/lib/tiaki-storage";

export function useTiakiItems(): TiakiItem[] {
  const [items, setItems] = useState<TiakiItem[]>([]);
  useEffect(() => {
    setItems(loadItems());
    const handler = () => setItems(loadItems());
    window.addEventListener("tiaki:items-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tiaki:items-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return items;
}

export function useTiakiProfile(): TiakiProfile {
  const [profile, setProfile] = useState<TiakiProfile>({ name: "friend" });
  useEffect(() => {
    setProfile(loadProfile());
    const handler = () => setProfile(loadProfile());
    window.addEventListener("tiaki:profile-changed", handler);
    return () => window.removeEventListener("tiaki:profile-changed", handler);
  }, []);
  return profile;
}
