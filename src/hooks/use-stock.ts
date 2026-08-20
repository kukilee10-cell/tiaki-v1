import { useEffect, useState } from "react";
import {
  CHANGED_EVENT,
  loadDocs,
  loadInbound,
  loadMovements,
  loadProducts,
  seedIfEmpty,
  type InboundOrder,
  type Movement,
  type Product,
  type StockDoc,
} from "@/lib/stock-storage";

function useLocal<T>(read: () => T[]): T[] {
  const [rows, setRows] = useState<T[]>([]);
  useEffect(() => {
    seedIfEmpty();
    const sync = () => setRows(read());
    sync();
    window.addEventListener(CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return rows;
}

export const useProducts = () => useLocal<Product>(loadProducts);
export const useMovements = () => useLocal<Movement>(loadMovements);
export const useInbound = () => useLocal<InboundOrder>(loadInbound);
export const useDocs = () => useLocal<StockDoc>(loadDocs);
