"use client";

import { Header } from "@/components/ui/header";
import { SearchBar } from "@/components/ui/searchbar";
import type React from "react";
import { useState } from "react";
import { mosques } from "./data/mosques";
import MosqueCard from "@/components/ui/mosque-card";

const Home: React.FC = () => {
	const [filteredMosques, setFilteredMosques] = useState<Mosque[]>(mosques);

	const handleSearch = (query: string) => {
		const lowercaseQuery = query.toLowerCase();
		const filtered = mosques.filter((mosque) =>
			mosque.name.toLowerCase().includes(lowercaseQuery),
		);
		setFilteredMosques(filtered);
	};

	return (
		<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<Header />
			<SearchBar onSearch={handleSearch} />
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{filteredMosques.map((mosque, index) => (
					<MosqueCard key={index} {...mosque} />
				))}
			</div>
		</div>
	);
};

export default Home;
