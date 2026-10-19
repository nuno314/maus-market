import { CategoryBadge } from "@/components/category-badge";
import { ConditionBadge } from "@/components/condition-badge";
import { listingCaption, type Category, type Condition } from "@/lib/sets";

export function ProductMeta({
  item,
  captionClassName = "text-sm text-[#5d7388]",
}: {
  item: {
    setCode: string;
    setName: string;
    number: string;
    category: Category;
    condition: Condition | string;
  };
  captionClassName?: string;
}) {
  return (
    <>
      <p className={captionClassName}>{listingCaption(item)}</p>
      <div className="mt-1">
        {item.category === "card" ? <ConditionBadge condition={item.condition} /> : <CategoryBadge category={item.category} />}
      </div>
    </>
  );
}
