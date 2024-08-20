"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onSearch(newValue);
  };

  return (
    <Input
      type="search"
      placeholder="Cari masjid/ surau/ institusi..."
      className={cn("w-full rounded-lg bg-muted dark:bg-zinc-800 px-4 py-2 text-sm dark:placeholder:text-slate-500", className)}
      value={searchTerm}
      onChange={handleInputChange}
    />
  );
};
