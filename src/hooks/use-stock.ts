import { useEffect, useState } from "react";
import {
  CHANGED_EVENT,
  loadDocs,
  loadMovements,
  loadProducts,
  type Movement,
  type Product,
  type StockDoc,
} from "@/lib/stock-storage";

function useLocal<T>(read: () => T[]): T[] {
  const [rows, setRows] = useState<T[]>([]);
  useEffect(() => {
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
export const useDocs = () => useLocal<StockDoc>(loadDocs);
