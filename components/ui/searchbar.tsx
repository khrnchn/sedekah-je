"use client";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => (
  <Input
    type="search"
    placeholder="Search for a mosque..."
    className="w-full rounded-lg bg-muted pl-8 pr-4 py-2 text-sm"
    onChange={(e) => onSearch(e.target.value)}
  />
);
