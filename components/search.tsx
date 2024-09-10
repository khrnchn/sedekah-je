import type React from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchProps = {
	onSearchChange: (query: string) => void;
	className?: string;
};

const Search = ({ onSearchChange, className }: SearchProps) => {
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSearchChange(e.target.value);
	};

	return (
		<div className={cn("w-full", className)}>
			<Input
				startIcon={SearchIcon}
				type="search"
				placeholder="Cari masjid/ surau/ institusi..."
				className="w-full rounded-lg bg-background text-sm border"
				onChange={handleSearchChange}
			/>
		</div>
	);
};

export default Search;
