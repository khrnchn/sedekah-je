"use client";

import { Header } from "@/components/ui/header";
import { SearchBar } from "@/components/ui/searchbar";
import type React from "react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { institutions } from "./data/institutions";
import InstitutionCard from "@/components/ui/institution-card";
import Filters from "@/components/sections/filters";
import dynamic from "next/dynamic";
import Ribbon from "@/components/ui/ribbon";

import { debounce } from "lodash-es";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Home: React.FC = () => {
	const [query, setQuery] = useState<string>("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [filteredInstitutions, setFilteredInstitutions] = useState<any[]>([]);
	const debouncedSetQuery = useCallback(
		debounce((newQuery: string) => {
			setQuery(newQuery);
		}, 300),
		[]
	);

	const handleSearch = useCallback((newQuery: string) => {
		debouncedSetQuery(newQuery);
	}, [debouncedSetQuery]);

	const handleFilters = (props: { categories: string[]; state: string }) => {
		setSelectedCategories(props.categories);
		setSelectedState(props.state);
	};

	const Map = useMemo(() => dynamic(
		() => import('@/components/map'),
		{
			loading: () => (
				<Card className="h-[240px] w-[965px]">
					<Skeleton className="min-h-full min-w-full flex items-center justify-center">
						<CardContent className="italic">
							Peta sedang dinampan...
						</CardContent>
					</Skeleton>
				</Card>
			),
			ssr: false
		}
	), [])

	// const filteredInstitutions = institutions.filter((institution) => {
	// 	const lowercaseQuery = query.toLowerCase();
	// 	return (
	// 		institution.name.toLowerCase().includes(lowercaseQuery) &&
	// 		(selectedCategories.length === 0 ||
	// 			selectedCategories.includes(institution.category)) && (selectedState ? institution.location === selectedState.toLocaleUpperCase().replaceAll('-', ' ') : true)
	// 	);
	// });

	useEffect(() => {
		setIsLoading(true);
		const filterData = new Promise((resolve) => {
			const filteredResults = institutions.filter((institution) => {
				const lowercaseQuery = query.toLowerCase();
				return (
					institution.name.toLowerCase().includes(lowercaseQuery) &&
					(selectedCategories.length === 0 ||
						selectedCategories.includes(institution.category)) && (selectedState ? institution.location === selectedState.toLocaleUpperCase().replaceAll('-', ' ') : true)
				);
			});
			resolve(filteredResults);
		});

		filterData.then((results) => {
			setFilteredInstitutions(results as any[]);
		});
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
	}, [query, selectedCategories, selectedState]);

	return (
		<div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-6 lg:gap-8">
			<Header />
			<Map />
			<Filters onChange={handleFilters} />
			<SearchBar onSearch={handleSearch} className="col-span-3" />

			{filteredInstitutions.length === 0 ? (
				<div className="flex flex-wrap justify-center">
					<p className="text-lg text-gray-500">Tiada institusi dijumpai.</p>
				</div>
			) : isLoading ? (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, idx) => (
						<Card key={idx} className="aspect-square w-full">
							<Skeleton className="min-h-full min-w-full" />
						</Card>
					))}
				</div>
			) : (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{filteredInstitutions.map((institution) => (
						<InstitutionCard key={institution.id} {...institution} />
					))}
				</div>
			)}
			<Ribbon />
		</div>
	);
};

export default Home;