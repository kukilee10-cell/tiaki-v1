import { motion, useMotionValue, useTransform } from "framer-motion";
import { Trash2 } from "lucide-react";
import { type ReactNode } from "react";

/**
 * Swipe-left-to-reveal-delete row. Native-feeling drag with a soft
 * threshold snap. Long-press friendly (no accidental drags at rest).
 */
export function SwipeItem({
  children,
  onDelete,
}: {
  children: ReactNode;
  onDelete: () => void;
}) {
  const x = useMotionValue(0);
  const bgOpacity = useTransform(x, [-100, -20, 0], [1, 0.4, 0]);
  const iconScale = useTransform(x, [-90, -40, 0], [1, 0.7, 0.4]);

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete backdrop */}
      <motion.div
        style={{ opacity: bgOpacity }}
        className="absolute inset-0 flex items-center justify-end pr-6"
      >
        <div className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(90deg, transparent 40%, rgba(224,114,90,0.28))" }}
        />
        <motion.button
          type="button"
          onClick={onDelete}
          style={{ scale: iconScale }}
          className="relative grid size-10 place-items-center rounded-full bg-[color:var(--destructive)] text-primary-foreground shadow-lg"
          aria-label="Delete"
        >
          <Trash2 className="size-4" strokeWidth={1.75} />
        </motion.button>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.15}
        style={{ x }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 || info.velocity.x < -400) {
            onDelete();
          } else {
            x.set(0);
          }
        }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
