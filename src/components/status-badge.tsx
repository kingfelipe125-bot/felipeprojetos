import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_BADGE_CLASSES, type DocumentStatus } from "@/lib/constants";

export function StatusBadge({ status, className }: { status: DocumentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        STATUS_BADGE_CLASSES[status],
        className
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
