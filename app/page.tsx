"use client";

import { Header } from "@/components/ui/header";
import { SearchBar } from "@/components/ui/searchbar";
import type React from "react";
import { useState } from "react";
import { institutions } from "./data/institutions";
import InstitutionCard from "@/components/ui/institution-card";
import Filters from "@/components/sections/filters";
import Ribbon from "@/components/ui/ribbon";

const Home: React.FC = () => {
	const [query, setQuery] = useState<string>("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

	const handleSearch = (query: string) => {
		setQuery(query);
	};

	const handleFilters = (props: { categories: string[] }) => {
		setSelectedCategories(props.categories);
	};

	const filteredInstitutions = institutions.filter((institution) => {
		const lowercaseQuery = query.toLowerCase();
		return (
			institution.name.toLowerCase().includes(lowercaseQuery) &&
			(selectedCategories.length === 0 ||
			selectedCategories.includes(institution.category))
		);
	});

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
			<Header />
			<Filters onChange={handleFilters} />
			<SearchBar onSearch={handleSearch} />
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{filteredInstitutions.map((institution) => (
					<InstitutionCard key={institution.id} {...institution} />
				))}
			</div>
			<Ribbon />
		</div>
	);
};

export default Home;
