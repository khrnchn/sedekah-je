"use client";

import { Header } from "@/components/ui/header";
import { SearchBar } from "@/components/ui/searchbar";
import type React from "react";
import { useState, useCallback } from "react";
import { institutions } from "./data/institutions";
import InstitutionCard from "@/components/ui/institution-card";
import Filters from "@/components/sections/filters";
import Ribbon from "@/components/ui/ribbon";
import { debounce } from "lodash-es";

const Home: React.FC = () => {
	const [query, setQuery] = useState<string>("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	const debouncedSetQuery = useCallback(
    debounce((newQuery: string) => {
      setQuery(newQuery);
    }, 300),
    []
  );

  const handleSearch = useCallback((newQuery: string) => {
    debouncedSetQuery(newQuery);
  }, [debouncedSetQuery]);

	const handleFilters = (props: { categories: string[] }) => {
		setSelectedCategories(props.categories);
	};

	const filteredInstitutions = institutions.filter((institution) => {
		const lowercaseQuery = query.toLowerCase().trim();

		const nameMatch = institution.name.toLowerCase().includes(lowercaseQuery);
		const locationMatch = institution.location.toLowerCase().includes(lowercaseQuery);

		return (nameMatch || locationMatch) && (selectedCategories.length === 0 || selectedCategories.includes(institution.category));
	});

	return (
		<div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-6 lg:gap-8">
			<Header />
			<Filters onChange={handleFilters} />
			<SearchBar onSearch={handleSearch} />
			<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
				{filteredInstitutions.map((institution) => (
					<InstitutionCard key={institution.id} {...institution} />
				))}
			</div>
			<Ribbon />
		</div>
	);
};

export default Home;