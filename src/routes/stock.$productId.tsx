import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Screen, SectionTitle, StatusTag } from "@/components/rotation/Chrome";
import { Field, Modal, SubmitBar } from "@/components/rotation/Actions";
import { useMovements, useProducts } from "@/hooks/use-stock";
import {
  applyMovement,
  deleteProduct,
  money,
  type MovementType,
} from "@/lib/stock-storage";

export const Route = createFileRoute("/stock/$productId")({
  head: () => ({
    meta: [
      { title: "Product Record — Rotation Co. Stock" },
      {
        name: "description",
        content:
          "Product record: on-hand quantity, costings, bin location and full movement history.",
      },
      { property: "og:title", content: "Product Record — Rotation Co. Stock" },
      {
        property: "og:description",
        content: "On-hand quantity, costings and movement history for this line item.",
      },
    ],
  }),
  component: ProductRecord,
});

const MOVE_LABEL: Record<MovementType, string> = {
  received: "RECEIVED",
  sold: "SOLD",
  sample: "SAMPLE",
  adjust: "ADJUSTMENT",
};

function ProductRecord() {
  const { productId } = Route.useParams();
  const navigate = useNavigate();
  const product = useProducts().find((p) => p.id === productId);
  const moves = useMovements()
    .filter((m) => m.productId === productId)
    .sort((a, b) => (a.at < b.at ? 1 : -1));
  const [adjust, setAdjust] = useState(false);
  const [qty, setQty] = useState("0");
  const [ref, setRef] = useState("");

  if (!product) {
    return (
      <Screen sub="Product Record">
        <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
          RECORD NOT FOUND.
        </p>
        <Link to="/stock" className="mt-3 inline-block font-mono text-[11px] text-hivis">
          ← STOCK REGISTER
        </Link>
      </Screen>
    );
  }

  return (
    <Screen sub="Product Record">
      <Link
        to="/stock"
        className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-steel-400"
      >
        <ArrowLeft className="size-3.5" /> STOCK REGISTER
      </Link>

      <div className="panel-raised hivis-edge px-3 py-3">
        <p className="label-industrial">{product.sku}</p>
        <h2 className="mt-1 font-display text-[20px] font-semibold uppercase tracking-[0.04em]">
          {product.name}
        </h2>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <p className="num-xl text-[38px] leading-none text-hivis">{product.onHand}</p>
            <p className="label-industrial mt-1">Units on hand</p>
          </div>
          <StatusTag product={product} />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Spec label="Unit cost" value={money(product.unitCost)} />
        <Spec label="Sell price" value={money(product.sellPrice)} />
        <Spec label="Reorder point" value={String(product.reorderPoint)} />
        <Spec label="Bin" value={product.bin ?? "—"} />
        <Spec label="Stock value" value={money(product.onHand * product.unitCost)} />
        <Spec label="Retail value" value={money(product.onHand * product.sellPrice)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setAdjust(true)}
          className="rounded-[3px] bg-hivis px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-primary-foreground active:opacity-80"
        >
          Adjust Stock
        </button>
        <button
          onClick={() => {
            deleteProduct(product.id);
            navigate({ to: "/stock" });
          }}
          className="flex items-center justify-center gap-2 rounded-[3px] border border-steel-700 px-3 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-steel-400 active:bg-steel-800"
        >
          <Trash2 className="size-3.5" /> Delete
        </button>
      </div>

      <div className="mt-5">
        <SectionTitle>Movement History</SectionTitle>
        {moves.length === 0 ? (
          <p className="panel px-3 py-4 font-mono text-[11px] text-steel-400">
            NO MOVEMENTS LOGGED.
          </p>
        ) : (
          <div className="panel divide-y divide-steel-700">
            {moves.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] tracking-[0.1em]">
                    {MOVE_LABEL[m.type]}
                  </p>
                  <p className="label-industrial mt-0.5">
                    {m.at.slice(0, 10)}
                    {m.ref ? ` · ${m.ref}` : ""}
                  </p>
                </div>
                <span
                  className="num-xl text-[18px]"
                  style={{ color: m.qty >= 0 ? "var(--ok)" : "var(--crit)" }}
                >
                  {m.qty > 0 ? `+${m.qty}` : m.qty}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={adjust} title="Adjust Stock" onClose={() => setAdjust(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyMovement(
              product.id,
              "adjust",
              Number(qty) || 0,
              ref.toUpperCase() || "STOCKTAKE",
            );
            setQty("0");
            setRef("");
            setAdjust(false);
          }}
          className="space-y-3"
        >
          <Field label="Signed quantity (+ / -)">
            <input
              className="w-full panel-recessed px-3 py-2.5 font-mono text-[13px] outline-none focus:border-hivis"
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </Field>
          <Field label="Reason / reference">
            <input
              className="w-full panel-recessed px-3 py-2.5 font-mono text-[13px] outline-none focus:border-hivis"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="STOCKTAKE"
            />
          </Field>
          <SubmitBar label="Post Adjustment" />
        </form>
      </Modal>
    </Screen>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-3 py-2.5">
      <p className="label-industrial">{label}</p>
      <p className="mt-1 font-mono text-[14px]">{value}</p>
    </div>
  );
}
