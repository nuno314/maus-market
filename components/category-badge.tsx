import { categoryLabel } from "@/lib/sets";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  "booster-box": "bg-[#d7ebf8] text-[#1a4f86]",
  "box-seal": "bg-[#e7f6ee] text-[#1f6b45]",
  "box-unseal": "bg-[#fff1d0] text-[#8a5b00]",
  pack: "bg-[#efe7f8] text-[#5b3d78]",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-bold", styles[category] ?? styles["booster-box"])}>
      {categoryLabel(category)}
    </span>
  );
}
