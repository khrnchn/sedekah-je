import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type SearchProps = {
	onSearchChange: (query: string) => void;
	className?: string;
	initialValue?: string;
};

const Search = ({ onSearchChange, className, initialValue }: SearchProps) => {
	const [searchValue, setSearchValue] = useState(initialValue || "");
	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setSearchValue(value);
		onSearchChange(value);
	};

	const inputRef = useRef<HTMLInputElement>(null);

	useHotkeys(["ctrl+k", "cmd+k"], (e) => {
		e.preventDefault();
		inputRef.current?.focus();
	});

	return (
		<div className={cn("w-full", className)}>
			<Input
				ref={inputRef}
				startIcon={SearchIcon}
				type="search"
				placeholder="Cari masjid/surau/institusi..."
				className="w-full rounded-lg bg-background text-sm border"
				value={searchValue}
				onChange={handleSearchChange}
			/>
		</div>
	);
};

export default Search;
