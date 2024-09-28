"use client";

import { debounce } from "lodash-es";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CollapsibleCustomMap from "@/components/custom-map";
import RawakFooter from "@/components/rawak-footer";
import { Card } from "@/components/ui/card";
import InstitutionCard from "@/components/ui/institution-card";
import PageSection from "@/components/ui/pageSection";
import { Skeleton } from "@/components/ui/skeleton";
import { removeDuplicateInstitutions, shuffleInstitutions } from "@/lib/utils";

import { institutions } from "@/app/data/institutions";
import type { Institution } from "@/app/types/institutions";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import Search from "@/components/search";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

const Home = () => {
	const [query, setQuery] = useState<string>("");
	const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
	const [selectedState, setSelectedState] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [offset, setOffset] = useState<number>(0);
	const [limit] = useState<number>(15);
	const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);

	// Remove duplicates based on institution name and shuffle institutions
	const _institutions = useMemo(() => {
		return shuffleInstitutions(removeDuplicateInstitutions(institutions));
	}, []);

	const [filteredInstitutions, setFilteredInstitutions] =
		useState<Institution[]>(_institutions);
	const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);

	const debouncedSetQuery = useMemo(
		() => debounce((newQuery: string) => setQuery(newQuery), 300),
		[],
	);

	const handleSearch = useCallback(
		(newQuery: string) => {
			debouncedSetQuery(newQuery);
		},
		[debouncedSetQuery],
	);

	const handleStateChange = useCallback((state: string) => {
		setSelectedState(state);
		setOffset(0);
		setAllItemsLoaded(false);
	}, []);

	const handleCategoryChange = useCallback((categories: string[]) => {
		setSelectedCategories(categories);
		setOffset(0);
		setAllItemsLoaded(false);
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
				const matchesQuery = institution.name
					.toLowerCase()
					.includes(lowercaseQuery);
				const matchesCategory =
					selectedCategories.length === 0 ||
					selectedCategories.includes(institution.category);
				const matchesState =
					!selectedState || institution.state === selectedState;
				return matchesQuery && matchesCategory && matchesState;
			});
		};

		const filterData = new Promise((resolve) => {
			const filteredResults = filterInstitutions();
			setTotalFilteredCount(filteredResults.length);
			resolve(filteredResults.slice(0, offset + limit));
		});

		filterData.then((_results) => {
			const results = _results as Institution[];
			if (results.length < offset + limit) {
				setAllItemsLoaded(true);
			}
			setFilteredInstitutions(results);
			setIsLoading(false);
			setIsLoadingMore(false);
		});
	}, [_institutions, query, selectedCategories, selectedState, offset, limit]);

	return (
		<PageSection>
			<FilterCategory
				onCategoryChange={handleCategoryChange}
				selectedState={selectedState}
				institutions={_institutions}
			/>
			<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
				<div className="w-full sm:w-1/5">
					<FilterState onStateChange={handleStateChange} className="w-full" />
				</div>
				<div className="w-full sm:w-4/5">
					<Search onSearchChange={handleSearch} className="w-full" />
				</div>
			</div>

			<div className="space-y-4">
				{/* Rendered only when there are filters applied */}
				{(selectedState !== "" || selectedCategories.length > 0) && (
					<FilteredCount count={totalFilteredCount} />
				)}
				<div className="flex justify-end gap-2">
					<CollapsibleCustomMap />
					<Link href="/faq" passHref>
						<Button
							variant="outline"
							className="bg-gradient-to-br from-blue-500 to-blue-300 border border-blue-400 rounded-full hover:from-blue-700 hover:to-blue-500 transition-colors"
						>
							<HelpCircle className="mr-2 h-5 w-5" />
							<span className="hidden sm:inline ml-2">Soalan Lazim</span>
							<span className="sm:hidden">FAQ</span>
						</Button>
					</Link>
				</div>
			</div>

			{isLoading ? (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: offset }).map((_, idx) => (
						<Card key={idx} className="aspect-square w-full">
							<Skeleton className="min-h-full min-w-full" />
						</Card>
					))}
				</div>
			) : filteredInstitutions.length === 0 ? (
				<div className="flex flex-wrap justify-center">
					<p className="text-lg text-gray-500">Tiada institusi dijumpai.</p>
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
			<RawakFooter />
		</PageSection>
	);
};

export default Home;
