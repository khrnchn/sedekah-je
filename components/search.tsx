import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search as SearchIcon } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Kbd } from "./kbd";

type SearchProps = {
	onSearchChange: (query: string) => void;
	className?: string;
	initialValue?: string;
};

const Search = ({ onSearchChange, className, initialValue }: SearchProps) => {
	const [searchValue, setSearchValue] = useState(initialValue || "");
	const [isMac, setIsMac] = useState(false);

	useEffect(() => {
		// Detect if user is on macOS
		setIsMac(
			typeof window !== "undefined" &&
				/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform),
		);
	}, []);

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
		<div className={cn("w-full relative", className)}>
			<Input
				ref={inputRef}
				startIcon={SearchIcon}
				type="search"
				placeholder="Cari masjid/surau/institusi..."
				className="w-full rounded-lg bg-background text-sm border pr-16"
				value={searchValue}
				onChange={handleSearchChange}
			/>
			<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
				<Kbd variant="outline">{isMac ? "⌘" : "Ctrl"}</Kbd>
				<Kbd variant="outline">K</Kbd>
			</div>
		</div>
	);
};

export default Search;
