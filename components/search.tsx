import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type SearchProps = {
	onSearchChange: (query: string) => void;
	className?: string;
};

const Search = ({ onSearchChange, className }: SearchProps) => {
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onSearchChange(e.target.value);
	};

	const inputRef = useRef<HTMLInputElement>(null);
	useHotkeys("mod+k", () => inputRef.current?.focus());

	return (
		<div className={cn("w-full", className)}>
			<Input
				ref={inputRef}
				startIcon={SearchIcon}
				type="search"
				placeholder="Cari masjid/surau/institusi..."
				className="w-full rounded-lg bg-background text-sm border"
				onChange={handleSearchChange}
			/>
		</div>
	);
};

export default Search;
