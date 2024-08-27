import { categories } from "@/app/types/institutions";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { institutions } from "../../app/data/institutions";
import { StatesDropdown } from "../states-dropdown";
import { Button } from "../ui/button";

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
	}));

	const router = useRouter();

	const handleStateFilters = (props: { state: string }) => {
		setSelectedState(props.state);
	};

	useEffect(() => {
		props.onChange({
			categories: selectedCategories,
			state: selectedState,
		});
	}, [selectedCategories, selectedState, props]);

	return (
		<div className="flex flex-col md:flex-row md:justify-between gap-4">
			<div className="grid grid-flow-col gap-1 items-center overflow-x-auto">
				<p className="max-sm:text-xs whitespace-nowrap">Pilih Tapisan: </p>
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
						className="px-4 py-2 rounded-xl text-sm max-sm:text-xs font-bold data-[active=true]:bg-slate-500 data-[active=true]:text-white truncate select-none flex flex-row gap-2 items-center justify-center whitespace-nowrap"
					>
						{category.label}
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
			<div className="flex flex-row items-center gap-2 w-full md:w-auto">
				<Button type="button" onClick={() => router.push("/rawak")}>
					Rawak
				</Button>
				<StatesDropdown onChange={handleStateFilters} />
			</div>
		</div>
	);
};

export default Filters;
