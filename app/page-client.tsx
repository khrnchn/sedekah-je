"use client";

import { findNearest, getDistance } from "geolib";
import type { GeolibInputCoordinates } from "geolib/es/types";
import { debounce } from "lodash-es";
import { Filter, HelpCircle, MapIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Institution as OldInstitution } from "@/app/types/institutions";
import CollapsibleCustomMap from "@/components/custom-map";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import RawakFooter from "@/components/rawak-footer";
import Search from "@/components/search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import InstitutionCard from "@/components/ui/institution-card";
import PageSection from "@/components/ui/pageSection";
import { Skeleton } from "@/components/ui/skeleton";
import type { Institution } from "@/db/schema";

type SearchParams = {
	search?: string;
	category?: string;
	state?: string;
	page?: string;
};

type Props = {
	initialInstitutions: Institution[];
	initialSearchParams: SearchParams;
};

const limit = 15;

export function PageClient({
	initialInstitutions,
	initialSearchParams,
}: Props) {
	const router = useRouter();
	const _searchParams = useSearchParams();

	// URL state
	const [query, setQuery] = useState<string>(initialSearchParams.search || "");
	const [selectedCategories, setSelectedCategories] = useState<string[]>(
		initialSearchParams.category?.split(",").filter(Boolean) || [],
	);
	const [selectedState, setSelectedState] = useState<string>(
		initialSearchParams.state || "",
	);

	// Component state
	const [institutions, _setInstitutions] =
		useState<Institution[]>(initialInstitutions);
	const [isLoading, _setIsLoading] = useState<boolean>(false);
	const [isLoadingMore, _setIsLoadingMore] = useState<boolean>(false);
	const [offset, setOffset] = useState<number>(0);
	const [allItemsLoaded, setAllItemsLoaded] = useState<boolean>(false);
	const [currentUserCoordinate, setCurrentUserCoordinate] =
		useState<GeolibInputCoordinates | null>(null);
	const [closestInstitution, setClosestInstitution] = useState<
		(OldInstitution & { distanceToCurrentUserInMeter: number }) | null
	>(null);

	// Map
	const [isMapVisible, setIsMapVisible] = useState(false);
	const toggleMap = () => {
		setIsMapVisible(!isMapVisible);
	};

	// Convert database Institution to component-compatible format
	const adaptedInstitutions = useMemo(() => {
		return institutions.map((inst) => ({
			...inst,
			description: inst.description || undefined,
			supportedPayment: inst.supportedPayment || undefined,
			coords: inst.coords || undefined,
			qrImage: inst.qrImage || "",
		})) as OldInstitution[];
	}, [institutions]);

	// Filter institutions client-side for now
	const filteredInstitutions = useMemo(() => {
		return adaptedInstitutions.filter((institution) => {
			if (!institution.name) return false;
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
	}, [adaptedInstitutions, query, selectedCategories, selectedState]);

	// Update URL when filters change
	const updateURL = useCallback(
		(newQuery: string, newCategories: string[], newState: string) => {
			const params = new URLSearchParams();

			if (newQuery) params.set("search", newQuery);
			if (newCategories.length > 0)
				params.set("category", newCategories.join(","));
			if (newState) params.set("state", newState);

			const newURL = params.toString() ? `/?${params.toString()}` : "/";
			router.push(newURL, { scroll: false });
		},
		[router],
	);

	const debouncedUpdateURL = useMemo(
		() =>
			debounce(
				(newQuery: string, newCategories: string[], newState: string) => {
					updateURL(newQuery, newCategories, newState);
				},
				500,
			),
		[updateURL],
	);

	const handleSearch = useCallback(
		(newQuery: string) => {
			setQuery(newQuery);
			setOffset(0);
			setAllItemsLoaded(false);
			debouncedUpdateURL(newQuery, selectedCategories, selectedState);
		},
		[debouncedUpdateURL, selectedCategories, selectedState],
	);

	const handleStateChange = useCallback(
		(state: string) => {
			setSelectedState(state);
			setOffset(0);
			setAllItemsLoaded(false);
			debouncedUpdateURL(query, selectedCategories, state);
		},
		[debouncedUpdateURL, query, selectedCategories],
	);

	const handleCategoryChange = useCallback(
		(categories: string[]) => {
			setSelectedCategories(categories);
			setOffset(0);
			setAllItemsLoaded(false);
			debouncedUpdateURL(query, categories, selectedState);
		},
		[debouncedUpdateURL, query, selectedState],
	);

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
		[isLoading],
	);

	const displayedInstitutions = filteredInstitutions.slice(0, offset + limit);
	const isFiltered = useMemo(
		() => query !== "" || selectedCategories.length > 0 || selectedState !== "",
		[query, selectedCategories, selectedState],
	);
	const activeFilterCount = useMemo(
		() => (selectedState !== "" ? 1 : 0) + selectedCategories.length,
		[selectedState, selectedCategories],
	);
	const filteredInstitutionsContainsClosest = useMemo(
		() =>
			filteredInstitutions.findIndex((i) => i.id === closestInstitution?.id) !==
			-1,
		[filteredInstitutions, closestInstitution],
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount for geolocation
	useEffect(() => {
		getLocation();
	}, []);

	async function getLocation() {
		navigator.geolocation.getCurrentPosition((p) => {
			setCurrentUserCoordinate({
				latitude: p.coords.latitude,
				longitude: p.coords.longitude,
			});
		});
	}

	useEffect(() => {
		if (isFiltered || !currentUserCoordinate || closestInstitution) return;

		const listOfCoords: { latitude: number; longitude: number; id: number }[] =
			[];

		for (const i of filteredInstitutions) {
			if (i.coords && Array.isArray(i.coords) && i.coords.length === 2) {
				listOfCoords.push({
					latitude: i.coords[0],
					longitude: i.coords[1],
					...i,
				});
			}
		}

		if (listOfCoords.length === 0) return;

		const closestCoordinate = findNearest(currentUserCoordinate, listOfCoords);
		const distanceToCurrentUserInMeter = getDistance(
			currentUserCoordinate,
			closestCoordinate,
		);

		const c = {
			...closestCoordinate,
			distanceToCurrentUserInMeter,
		} as unknown as OldInstitution & { distanceToCurrentUserInMeter: number };

		setClosestInstitution(c);
	}, [
		currentUserCoordinate,
		filteredInstitutions,
		isFiltered,
		closestInstitution,
	]);

	// Check if we've loaded all items
	useEffect(() => {
		if (filteredInstitutions.length <= offset + limit) {
			setAllItemsLoaded(true);
		} else {
			setAllItemsLoaded(false);
		}
	}, [filteredInstitutions, offset]);

	return (
		<PageSection>
			{/* Desktop (sm+): keep current stacked filter UI */}
			<div className="hidden sm:block sticky top-0 z-40 pt-4 pb-4 space-y-4 bg-background border-b shadow-sm">
				<FilterCategory
					onCategoryChange={handleCategoryChange}
					selectedState={selectedState}
					institutions={adaptedInstitutions}
					initialCategories={selectedCategories}
				/>

				<div className="space-y-4">
					<div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full">
						<div className="w-full sm:w-1/5">
							<FilterState
								onStateChange={handleStateChange}
								className="w-full"
								initialState={selectedState}
							/>
						</div>
						<div className="w-full sm:w-4/5">
							<Search
								onSearchChange={handleSearch}
								className="w-full"
								initialValue={query}
							/>
						</div>
					</div>

					{/* Rendered only when there are filters applied */}
					{(selectedState !== "" || selectedCategories.length > 0) && (
						<FilteredCount count={filteredInstitutions.length} />
					)}
				</div>
			</div>

			{/* Mobile (<sm): compact sticky row + filter drawer */}
			<div className="sm:hidden sticky top-0 z-40 pt-4 pb-4 bg-background border-b shadow-sm">
				<div className="flex items-center gap-2 w-full">
					<div className="flex-1 min-w-0">
						<Search
							onSearchChange={handleSearch}
							className="w-full"
							initialValue={query}
						/>
					</div>
					<Drawer>
						<DrawerTrigger asChild>
							<Button
								variant="outline"
								size="default"
								className="shrink-0 flex items-center gap-2"
							>
								<Filter className="h-4 w-4" />
								<span>Filter</span>
								{activeFilterCount > 0 && (
									<Badge
										variant="secondary"
										className="ml-0.5 h-5 min-w-5 px-1.5"
									>
										{activeFilterCount}
									</Badge>
								)}
							</Button>
						</DrawerTrigger>
						<DrawerContent className="max-h-[85vh] flex flex-col">
							<DrawerHeader>
								<DrawerTitle>Filter</DrawerTitle>
							</DrawerHeader>
							<div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
								<FilterState
									onStateChange={handleStateChange}
									className="w-full"
									initialState={selectedState}
								/>
								<FilterCategory
									onCategoryChange={handleCategoryChange}
									selectedState={selectedState}
									institutions={adaptedInstitutions}
									initialCategories={selectedCategories}
								/>
							</div>
							{(selectedState !== "" || selectedCategories.length > 0) && (
								<DrawerFooter>
									<FilteredCount count={filteredInstitutions.length} />
								</DrawerFooter>
							)}
						</DrawerContent>
					</Drawer>
				</div>
			</div>

			<div className="flex justify-end gap-2 mt-4">
				<Button
					onClick={toggleMap}
					variant="outline"
					className="bg-gradient-to-br from-orange-500 to-orange-300 border border-orange-400 rounded-full hover:from-orange-600 hover:to-orange-400 transition-colors"
				>
					<MapIcon className="mr-2 h-5 w-5" />
					<span className="hidden sm:inline">
						{isMapVisible ? "Sembunyikan Peta" : "Tunjukkan Peta"}
					</span>
					<span className="sm:hidden">Peta</span>
				</Button>

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

			<CollapsibleCustomMap
				isVisible={isMapVisible}
				showAll={true}
				filteredInstitutions={filteredInstitutions}
			/>

			{isLoading ? (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: limit }).map((_, idx) => (
						<Card key={idx} className="aspect-square w-full">
							<Skeleton className="min-h-full min-w-full" />
						</Card>
					))}
				</div>
			) : displayedInstitutions.length === 0 ? (
				<div className="flex flex-wrap justify-center">
					<p className="text-lg text-gray-500">Tiada institusi dijumpai.</p>
				</div>
			) : (
				<div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{closestInstitution && filteredInstitutionsContainsClosest && (
						<InstitutionCard
							key={closestInstitution.id}
							{...closestInstitution}
							ref={
								displayedInstitutions.length === 1 ? lastPostElementRef : null
							}
							isClosest
						/>
					)}
					{displayedInstitutions
						.filter((i) =>
							filteredInstitutionsContainsClosest && closestInstitution
								? i.id !== closestInstitution.id
								: true,
						)
						.map((institution, i) => (
							<InstitutionCard
								key={institution.id}
								{...institution}
								ref={
									displayedInstitutions.length === i + 1
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
}
