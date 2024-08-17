import React from 'react';
import { cva, type VariantProps } from "class-variance-authority";
import { categories, Category } from '@/app/types/institutions';
import { cn } from "@/lib/utils";


const labelVariants = cva("px-2 py-1 rounded text-sm font-bold", {
  variants: {
    category: {
      mosque: "bg-blue-500 text-white",
      surau: "bg-green-500 text-white",
      others: "bg-slate-200 text-slate-600",
    },
  }
});
type LabelVariant = VariantProps<typeof labelVariants>;

type Props = {
  category: Category;
} & LabelVariant;

const CategoryLabel = (props: Props) => {
  return (
    <div className={cn(labelVariants({ category: props.category }))}>{categories[props.category].label}</div>
  )
}

export default CategoryLabel;