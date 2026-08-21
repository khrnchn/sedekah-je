import { cva, type VariantProps } from "class-variance-authority";
import React from "react";
import type { Category } from "@/app/types/institutions";
import {
	getInstitutionCategoryLabel,
	normalizeInstitutionCategory,
} from "@/lib/institution-categories";
import { cn } from "@/lib/utils";

const labelVariants = cva("px-2 py-1 rounded text-sm font-bold", {
	variants: {
		category: {
			masjid: "bg-blue-500 text-white",
			surau: "bg-green-500 text-white",
			tahfiz: "bg-amber-500 text-white",
			kebajikan: "bg-orange-500 text-white",
			"lain-lain": "bg-violet-500 text-white",
		},
	},
});

type LabelVariant = VariantProps<typeof labelVariants>;

type Props = {
	category: Category;
} & LabelVariant;

const CategoryLabel = (props: Props) => {
	const normalizedCategory = normalizeInstitutionCategory(props.category);

	return (
		<div className={cn(labelVariants({ category: normalizedCategory }))}>
			{getInstitutionCategoryLabel(props.category)}
		</div>
	);
};

export default CategoryLabel;
