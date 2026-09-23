import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  A: "bg-[#d7ebf8] text-[#1a4f86]",
  "A-": "bg-[#fff1d0] text-[#8a5b00]",
  B: "bg-[#e7edf3] text-[#3d4d5c]",
};

export function ConditionBadge({ condition }: { condition: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-bold", styles[condition] ?? styles.B)}>
      Condition {condition}
    </span>
  );
}
