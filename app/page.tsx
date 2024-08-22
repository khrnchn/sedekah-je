"use client";

import Filters from "@/components/sections/filters";
import { Card, CardContent } from "@/components/ui/card";
import InstitutionCard from "@/components/ui/institution-card";
import { ModeToggle } from "@/components/ui/mode-toggle";
import PageSection from "@/components/ui/pageSection";
import { SearchBar } from "@/components/ui/searchbar";
import { Skeleton } from "@/components/ui/skeleton";
import { debounce } from "lodash-es";
import dynamic from "next/dynamic";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { institutions } from "./data/institutions";
import type { Institution } from "./types/institutions";

const Home: React.FC = () => {
	const [query, setQuery] = useState<string>("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>();
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [offset, setOffset] = useState<number>(0);
	const [limit] = useState<number>(15);
	const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);
	const [filteredInstitutions, setFilteredInstitutions] = useState<
		Institution[]
	>([]);

	const debouncedSetQuery = useCallback(
		debounce((newQuery: string) => {
			setQuery(newQuery);
		}, 300),
		[],
	);

	const handleSearch = useCallback(
		(newQuery: string) => {
			debouncedSetQuery(newQuery);
		},
		[debouncedSetQuery],
	);

	const handleFilters = (props: { categories: string[]; state: string }) => {
		setSelectedCategories(props.categories);
		setSelectedState(props.state);
	};

	const CustomMap = useMemo(
		() =>
			dynamic(() => import("@/components/map"), {
				loading: () => (
					<Card className="min-h-[240px] md:min-h-[240px] md:min-w-[965px]">
						<Skeleton className="min-h-full min-w-full flex items-center justify-center">
							<CardContent className="italic">
								Peta sedang dinampan...
							</CardContent>
						</Skeleton>
					</Card>
				),
				ssr: false,
			}),
		[],
	);

	const _institutions = useMemo(() => {
		// remove duplicates based on institution name
		return institutions.filter(
			(institution, index, self) =>
				index ===
				self.findIndex(
					(t) => t.name.toLowerCase() === institution.name.toLowerCase(),
				),
		);
	}, []);

	const observer = useRef<IntersectionObserver | null>(null);

	const lastPostElementRef = useCallback(
		(node: HTMLDivElement) => {
			if (isLoading) return;
			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					setOffset((prevOffset) => prevOffset + limit);
				}
			});

			if (node) observer.current.observe(node);
		},
		[isLoading, limit],
	);

	useEffect(() => {
		setIsLoadingMore(true);

		const filterInstitutions = () => {
			return _institutions.filter((institution) => {
				const lowercaseQuery = query.toLowerCase();

				const matchesQuery = institution.name.toLowerCase().includes(lowercaseQuery);
				const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(institution.category);
				const matchesState = !selectedState || institution.state === selectedState;

				return matchesQuery && matchesCategory && matchesState;
			});
		};

		const filterData = new Promise((resolve) => {
			const filteredResults = filterInstitutions();
			resolve(filteredResults.slice(0, offset + limit));
		});

		filterData.then((_results) => {
			const results = _results as Institution[];

			if (results.length < offset + limit) {
				setAllItemsLoaded(true);
			}
			setFilteredInstitutions(results);
		});

		setTimeout(() => {
			setIsLoading(false);
			setIsLoadingMore(false);
		}, 1000);

	}, [_institutions, query, selectedCategories, selectedState, offset, limit]);

	return (
		<PageSection>
			<CustomMap />
			<Filters onChange={handleFilters} />

			<div className="flex justify-end items-center gap-4 mb-4">
				<SearchBar onSearch={handleSearch} />
				<ModeToggle />
			</div>

			{filteredInstitutions.length === 0 ? (
				<div className="flex flex-wrap justify-center">
					<p className="text-lg text-gray-500">Tiada institusi dijumpai.</p>
				</div>
			) : isLoading ? (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: offset }).map((_, idx) => (
						<Card key={idx} className="aspect-square w-full">
							<Skeleton className="min-h-full min-w-full" />
						</Card>
					))}
				</div>
			) : (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{filteredInstitutions.map((institution, i) => (
						<InstitutionCard
							key={institution.id}
							{...institution}
							ref={
								filteredInstitutions.length === i + 1
									? lastPostElementRef
									: null
							}
						/>
					))}
				</div>
			)}
			{isLoadingMore && !allItemsLoaded && (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }).map((_, idx) => (
						<Card key={idx} className="aspect-square w-full">
							<Skeleton className="min-h-full min-w-full" />
						</Card>
					))}
				</div>
			)}
		</PageSection>
	);
};

export default Home;
