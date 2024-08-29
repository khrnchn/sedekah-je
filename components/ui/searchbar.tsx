import { StatesDropdown } from "@/components/states-dropdown";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef, useEffect, useState } from "react";

interface SearchBarProps {
	onSearch: (query: string) => void;
	className?: string;
	onChange: (props: {
		categories: string[];
		state: string;
	}) => void;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
	({ onSearch, className, onChange }) => {
		const [searchTerm, setSearchTerm] = useState("");
		const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
		const [selectedState, setSelectedState] = useState<string>("");

		const handleStateFilters = (props: { state: string }) => {
			setSelectedState(props.state);
			onChange({
				categories: selectedCategories,
				state: props.state === "all_states" ? "" : props.state,
			});
		};

		useEffect(() => {
			onChange({
				categories: selectedCategories,
				state: selectedState,
			});
		}, [selectedCategories, selectedState, onChange]);

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setSearchTerm(newValue);
			onSearch(newValue);
		};

		return (
			<div className="w-full flex flex-row items-center justify-center gap-2">
				<div className="w-1/5">
					<StatesDropdown onChange={handleStateFilters} />
				</div>
				<Input
					type="search"
					placeholder="Cari masjid/ surau/ institusi..."
					className={cn(
						"w-full rounded-full bg-background px-4 py-2 text-sm border border-gray-400 dark:border-slate-900",
						className,
					)}
					value={searchTerm}
					onChange={handleInputChange}
				/>
			</div>
		);
	},
);

SearchBar.displayName = "SearchBar";
