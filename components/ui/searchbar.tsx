import { StatesDropdown } from "@/components/states-dropdown";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";

interface SearchBarProps {
	onSearch: (query: string) => void;
	className?: string;
}

export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
	({ onSearch, className }) => {
		const [searchTerm, setSearchTerm] = useState("");

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value;
			setSearchTerm(newValue);
			onSearch(newValue);
		};

		const handleStateFilters = (props: { state: string }) => {
			setSearchTerm(props.state);
		};

		return (
			<div className="w-full flex flex-row items-center justify-center gap-2">
				<div className="w-1/5 rounded-full">
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
