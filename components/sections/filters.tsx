import { categories } from "@/app/types/institutions";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { institutions } from "../../app/data/institutions";

type Props = {
	onChange: (props: {
		categories: string[];
		state: string;
	}) => void;
};

const Filters = (props: Props) => {
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const mappedCategories = Object.keys(categories).map((category) => ({
		label: categories[category as keyof typeof categories].label,
		value: category,
		icon: categories[category as keyof typeof categories].icon,
	}));

	useEffect(() => {
		props.onChange({
			categories: selectedCategories,
			state: selectedState,
		});
	}, [selectedCategories, selectedState, props]);

	return (
		<div className="flex flex-col md:flex-row md:justify-between gap-4">
			<div className="flex items-center justify-center flex-row  gap-1 w-full">
				{mappedCategories.map((category) => (
					<button
						type="button"
						key={category.value}
						onClick={() => {
							if (selectedCategories.includes(category.value)) {
								setSelectedCategories(
									selectedCategories.filter((c) => c !== category.value),
								);
							} else {
								setSelectedCategories([...selectedCategories, category.value]);
							}
						}}
						data-active={selectedCategories.includes(category.value)}
						className="px-4 py-2 text-sm max-sm:text-xs font-bold data-[active=true]:bg-slate-500 data-[active=true]:text-white truncate select-none flex flex-row gap-2 items-center justify-center whitespace-nowrap bg-background w-fit border border-border rounded-full shadow-md dark:shadow-muted/50"
					>
						{/* {category.label} */}
						<Image
							src={category.icon}
							alt={category.label}
							width={24}
							height={24}
						/>
						<span className="hidden md:block">{category.label}</span>
						<span className="rounded-full px-2 py-1 bg-slate-200 text-black">
							{
								institutions.filter(
									(ins) =>
										ins.category === category.value &&
										(selectedState ? ins.state === selectedState : true),
								).length
							}
						</span>
					</button>
				))}
			</div>
		</div>
	);
};

export default Filters;
