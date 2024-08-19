"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
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
      className="w-full rounded-lg bg-muted pl-8 pr-4 py-2 text-sm"
      value={searchTerm}
      onChange={handleInputChange}
    />
  );
};
