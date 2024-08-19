"use client";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, className }) => (
  <Input
    type="search"
    placeholder="Cari masjid/ surau/ institusi..."
    className={`w-full rounded-lg bg-muted pl-8 pr-4 py-2 text-sm ${className ?? ""}`}
    onChange={(e) => onSearch(e.target.value)}
  />
);
