"use client";

import { findNearest, getDistance } from "geolib";
import type { GeolibInputCoordinates } from "geolib/es/types";
import { debounce } from "lodash-es";
import { Filter, LocateFixed, MapIcon, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Institution as OldInstitution } from "@/app/types/institutions";
import FilterCategory from "@/components/filter-category";
import FilterState from "@/components/filter-state";
import FilteredCount from "@/components/filtered-count";
import InstitutionCard from "@/components/institution/institution-card";
import CollapsibleCustomMap from "@/components/map/custom-map";
import RawakFooter from "@/components/rawak-footer";
import Search from "@/components/search";
import PageSection from "@/components/shared/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import {
	type CanonicalInstitutionCategory,
	normalizeInstitutionCategory,
} from "@/lib/institution-categories";
import type { PublicInstitution } from "@/lib/queries/institutions";

type SearchParams = {
	search?: string;
	category?: string;
	state?: string;
	page?: string;
};

type Props = {
	initialResult: InstitutionsApiResult;
	initialSearchParams: SearchParams;
};

const limit = 50;

/** If set in sessionStorage, automatic nearest lookup will not re-run after the user denies location. */
const GEO_SKIP_AUTO_SESSION_KEY = "sedekah-je-geo-skip-auto";

type NormalizedInstitution = Omit<OldInstitution, "category"> & {
	category: CanonicalInstitutionCategory;
};

type InstitutionsApiResult = {
	institutions: PublicInstitution[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		hasMore: boolean;
		totalPages: number;
	};
	facets: {
		categoryCounts: Partial<Record<CanonicalInstitutionCategory, number>>;
	};
};

type InstitutionListRequest = {
	query: string;
	categories: CanonicalInstitutionCategory[];
	state: string;
	page: number;
	append?: boolean;
};

export function PageClient({ initialResult, initialSearchParams }: Props) {
	const router = useRouter();
	const requestIdRef = useRef(0);
	/** Reset when any filter is applied so clearing filters can trigger auto-locate again. */
	const autoLocateEligibleRef = useRef(false);

	const [query, setQuery] = useState<string>(initialSearchParams.search || "");
	const [selectedCategories, setSelectedCategories] = useState<
		CanonicalInstitutionCategory[]
	>(
		initialSearchParams.category
			?.split(",")
			.filter(Boolean)
			.map((category) => normalizeInstitutionCategory(category)) || [],
	);
	const [selectedState, setSelectedState] = useState<string>(
		initialSearchParams.state || "",
	);
	const [institutions, setInstitutions] = useState<PublicInstitution[]>(
		initialResult.institutions,
	);
	const [pagination, setPagination] = useState(initialResult.pagination);
	const [categoryCounts, setCategoryCounts] = useState(
		initialResult.facets.categoryCounts,
	);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [mapInstitutions, setMapInstitutions] = useState<
		NormalizedInstitution[]
	>([]);
	const [isMapLoading, setIsMapLoading] = useState(false);
	const [isLocating, setIsLocating] = useState(false);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [closestInstitution, setClosestInstitution] = useState<
		(NormalizedInstitution & { distanceToCurrentUserInMeter: number }) | null
	>(null);

	const [isMapVisible, setIsMapVisible] = useState(false);

	const adaptInstitutions = useCallback((items: PublicInstitution[]) => {
		return items.map((inst) => ({
			...inst,
			category: normalizeInstitutionCategory(inst.category),
			description: inst.description || undefined,
			supportedPayment: inst.supportedPayment || undefined,
			coords: inst.coords || undefined,
			qrImage: inst.qrImage || "",
		})) as NormalizedInstitution[];
	}, []);

	const adaptedInstitutions = useMemo(
		() => adaptInstitutions(institutions),
		[institutions, adaptInstitutions],
	);

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

	const buildInstitutionsUrl = useCallback(
		({
			query: nextQuery,
			categories,
			state,
			page,
			mode,
		}: InstitutionListRequest & { mode?: "page" | "markers" }) => {
			const params = new URLSearchParams();
			if (nextQuery) params.set("search", nextQuery);
			if (categories.length > 0) params.set("category", categories.join(","));
			if (state) params.set("state", state);
			if (mode) params.set("mode", mode);
			params.set("page", String(page));
			params.set("limit", String(limit));
			return `/api/institutions?${params.toString()}`;
		},
		[],
	);

	const loadInstitutions = useCallback(
		async ({
			query: nextQuery,
			categories,
			state,
			page,
			append = false,
		}: InstitutionListRequest) => {
			const requestId = ++requestIdRef.current;
			if (append) {
				setIsLoadingMore(true);
			} else {
				setIsLoading(true);
			}

			try {
				const response = await fetch(
					buildInstitutionsUrl({
						query: nextQuery,
						categories,
						state,
						page,
					}),
				);
				if (!response.ok) throw new Error("Failed to fetch institutions");

				const result = (await response.json()) as InstitutionsApiResult;
				if (requestId !== requestIdRef.current) return;

				setInstitutions((current) =>
					append ? [...current, ...result.institutions] : result.institutions,
				);
				setPagination(result.pagination);
				setCategoryCounts(result.facets.categoryCounts);
				if (!append) {
					setClosestInstitution(null);
					setMapInstitutions([]);
				}
			} catch (error) {
				console.error(error);
				setLocationError("Senarai QR tidak dapat dimuatkan. Cuba sekali lagi.");
			} finally {
				if (requestId === requestIdRef.current) {
					setIsLoading(false);
					setIsLoadingMore(false);
				}
			}
		},
		[buildInstitutionsUrl],
	);

	const debouncedSearch = useMemo(
		() =>
			debounce(
				(
					nextQuery: string,
					categories: CanonicalInstitutionCategory[],
					state: string,
				) => {
					updateURL(nextQuery, categories, state);
					loadInstitutions({
						query: nextQuery,
						categories,
						state,
						page: 1,
					});
				},
				500,
			),
		[loadInstitutions, updateURL],
	);

	const handleSearch = useCallback(
		(newQuery: string) => {
			setQuery(newQuery);
			debouncedSearch(newQuery, selectedCategories, selectedState);
		},
		[debouncedSearch, selectedCategories, selectedState],
	);

	const handleStateChange = useCallback(
		(state: string) => {
			debouncedSearch.cancel();
			setSelectedState(state);
			updateURL(query, selectedCategories, state);
			loadInstitutions({
				query,
				categories: selectedCategories,
				state,
				page: 1,
			});
		},
		[debouncedSearch, loadInstitutions, query, selectedCategories, updateURL],
	);

	const handleCategoryChange = useCallback(
		(categories: string[]) => {
			debouncedSearch.cancel();
			const normalizedCategories = categories.map((category) =>
				normalizeInstitutionCategory(category),
			);
			setSelectedCategories(normalizedCategories);
			updateURL(query, normalizedCategories, selectedState);
			loadInstitutions({
				query,
				categories: normalizedCategories,
				state: selectedState,
				page: 1,
			});
		},
		[debouncedSearch, loadInstitutions, query, selectedState, updateURL],
	);

	const clearFilters = useCallback(() => {
		debouncedSearch.cancel();
		setQuery("");
		setSelectedCategories([]);
		setSelectedState("");
		updateURL("", [], "");
		loadInstitutions({
			query: "",
			categories: [],
			state: "",
			page: 1,
		});
	}, [debouncedSearch, loadInstitutions, updateURL]);

	const observer = useRef<IntersectionObserver | null>(null);

	const lastPostElementRef = useCallback(
		(node: HTMLDivElement) => {
			if (isLoading || isLoadingMore || !pagination.hasMore) return;
			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting) {
					loadInstitutions({
						query,
						categories: selectedCategories,
						state: selectedState,
						page: pagination.page + 1,
						append: true,
					});
				}
			});

			if (node) observer.current.observe(node);
		},
		[
			isLoading,
			isLoadingMore,
			loadInstitutions,
			pagination.hasMore,
			pagination.page,
			query,
			selectedCategories,
			selectedState,
		],
	);

	const displayedInstitutions = adaptedInstitutions;
	const isFiltered = useMemo(
		() => query !== "" || selectedCategories.length > 0 || selectedState !== "",
		[query, selectedCategories, selectedState],
	);
	const activeFilterCount = useMemo(
		() =>
			(query !== "" ? 1 : 0) +
			(selectedState !== "" ? 1 : 0) +
			selectedCategories.length,
		[query, selectedCategories, selectedState],
	);
	const filteredInstitutionsContainsClosest = useMemo(
		() =>
			adaptedInstitutions.findIndex((i) => i.id === closestInstitution?.id) !==
			-1,
		[adaptedInstitutions, closestInstitution],
	);

	const fetchFilteredInstitutionsForMap = useCallback(async () => {
		setIsMapLoading(true);
		try {
			const response = await fetch(
				buildInstitutionsUrl({
					query,
					categories: selectedCategories,
					state: selectedState,
					page: 1,
					mode: "markers",
				}),
			);
			if (!response.ok) throw new Error("Failed to fetch map institutions");
			const items = (await response.json()) as PublicInstitution[];
			const mappedInstitutions = adaptInstitutions(items);
			setMapInstitutions(mappedInstitutions);
			return mappedInstitutions;
		} catch (error) {
			console.error(error);
			setLocationError("Data peta tidak dapat dimuatkan. Cuba sekali lagi.");
			return [];
		} finally {
			setIsMapLoading(false);
		}
	}, [
		adaptInstitutions,
		buildInstitutionsUrl,
		query,
		selectedCategories,
		selectedState,
	]);

	const toggleMap = useCallback(() => {
		setIsMapVisible((current) => !current);
	}, []);

	const resolveClosestInstitution = useCallback(
		async (coordinate: GeolibInputCoordinates) => {
			const filteredWithCoords = await fetchFilteredInstitutionsForMap();
			const listOfCoords: (NormalizedInstitution & {
				latitude: number;
				longitude: number;
			})[] = [];

			for (const institution of filteredWithCoords) {
				if (
					institution.coords &&
					Array.isArray(institution.coords) &&
					institution.coords.length === 2
				) {
					listOfCoords.push({
						...institution,
						latitude: institution.coords[0],
						longitude: institution.coords[1],
					});
				}
			}

			if (listOfCoords.length === 0) {
				setLocationError("Tiada institusi dengan lokasi untuk tapisan ini.");
				return;
			}

			const closestCoordinate = findNearest(coordinate, listOfCoords);
			const distanceToCurrentUserInMeter = getDistance(
				coordinate,
				closestCoordinate,
			);

			setClosestInstitution({
				...closestCoordinate,
				distanceToCurrentUserInMeter,
			} as unknown as NormalizedInstitution & {
				distanceToCurrentUserInMeter: number;
			});
		},
		[fetchFilteredInstitutionsForMap],
	);

	const getLocation = useCallback(
		(opts?: { fromAuto?: boolean }) => {
			const fromAuto = opts?.fromAuto ?? false;

			if (!("geolocation" in navigator)) {
				setLocationError("Lokasi tidak disokong oleh pelayar ini.");
				return;
			}

			setIsLocating(true);
			setLocationError(null);

			navigator.geolocation.getCurrentPosition(
				(p) => {
					const coordinate = {
						latitude: p.coords.latitude,
						longitude: p.coords.longitude,
					};
					void resolveClosestInstitution(coordinate).finally(() => {
						setIsLocating(false);
					});
				},
				(err) => {
					setIsLocating(false);
					if (err.code === err.PERMISSION_DENIED) {
						if (fromAuto && typeof window !== "undefined") {
							try {
								sessionStorage.setItem(GEO_SKIP_AUTO_SESSION_KEY, "1");
							} catch {
								/* private / blocked storage */
							}
						}
						setLocationError(
							"Kebenaran lokasi ditolak. Aktifkan lokasi dalam tetapan pelayar untuk cari institusi terdekat.",
						);
					} else if (err.code === err.POSITION_UNAVAILABLE) {
						setLocationError(
							"Lokasi tidak tersedia buat masa ini. Cuba sekali lagi.",
						);
					} else if (err.code === err.TIMEOUT) {
						setLocationError("Permintaan lokasi tamat masa. Cuba sekali lagi.");
					} else {
						setLocationError(
							"Lokasi tidak dapat diakses. Semak kebenaran lokasi.",
						);
					}
				},
				{ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
			);
		},
		[resolveClosestInstitution],
	);

	useEffect(() => {
		if (typeof window === "undefined") return;
		if (!("geolocation" in navigator)) return;

		const noFilters =
			query === "" && selectedCategories.length === 0 && selectedState === "";

		if (!noFilters) {
			autoLocateEligibleRef.current = false;
			return;
		}

		try {
			if (sessionStorage.getItem(GEO_SKIP_AUTO_SESSION_KEY)) return;
		} catch {
			return;
		}

		if (autoLocateEligibleRef.current) return;
		autoLocateEligibleRef.current = true;

		getLocation({ fromAuto: true });
	}, [query, selectedCategories, selectedState, getLocation]);

	useEffect(() => {
		return () => debouncedSearch.cancel();
	}, [debouncedSearch]);

	useEffect(() => {
		if (!isMapVisible || isMapLoading || mapInstitutions.length > 0) return;
		void fetchFilteredInstitutionsForMap();
	}, [
		fetchFilteredInstitutionsForMap,
		isMapLoading,
		isMapVisible,
		mapInstitutions.length,
	]);

	return (
		<PageSection className="pb-28 sm:pb-32 lg:pb-36">
			{/* Desktop (sm+): stacked filter bar with integrated actions */}
			<div className="sticky top-0 z-40 hidden rounded-b-lg border border-border/70 bg-background/95 px-3 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:block">
				<FilterCategory
					onCategoryChange={handleCategoryChange}
					selectedState={selectedState}
					institutions={adaptedInstitutions}
					initialCategories={selectedCategories}
					categoryCounts={categoryCounts}
				/>

				<div className="mt-3 space-y-2">
					<div className="flex w-full items-center gap-2">
						<div className="w-56 shrink-0">
							<FilterState
								onStateChange={handleStateChange}
								className="w-full"
								initialState={selectedState}
							/>
						</div>
						<div className="flex-1">
							<Search
								onSearchChange={handleSearch}
								className="w-full"
								initialValue={query}
							/>
						</div>
						{isFiltered && (
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={clearFilters}
								className="shrink-0 text-muted-foreground hover:text-primary"
								aria-label="Set semula tapisan"
							>
								<RotateCcw className="h-4 w-4" />
							</Button>
						)}
						<Button
							onClick={() => getLocation()}
							variant="ghost"
							size="icon"
							disabled={isLocating}
							className="shrink-0 text-muted-foreground hover:text-primary"
							aria-label={isLocating ? "Mencari..." : "Cari institusi terdekat"}
						>
							<LocateFixed className="h-4 w-4" />
						</Button>
						<Button
							onClick={toggleMap}
							variant="ghost"
							size="icon"
							className="shrink-0 text-muted-foreground hover:text-primary"
							aria-label={isMapVisible ? "Sembunyikan peta" : "Tunjukkan peta"}
						>
							<MapIcon className="h-4 w-4" />
						</Button>
					</div>

					{isFiltered && <FilteredCount count={pagination.total} />}
				</div>
			</div>

			{/* Mobile (<sm): compact sticky row + filter drawer */}
			<div className="sticky top-0 z-40 py-3 sm:hidden">
				<div className="flex w-full items-center gap-2 rounded-lg border border-border/70 bg-background/95 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
					<div className="flex-1 min-w-0">
						<Search
							onSearchChange={handleSearch}
							className="w-full"
							initialValue={query}
							hideShortcut
						/>
					</div>
					<Drawer>
						<DrawerTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="relative shrink-0"
								aria-label="Tapis"
							>
								<Filter className="h-4 w-4" />
								{activeFilterCount > 0 && (
									<Badge
										variant="secondary"
										className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]"
									>
										{activeFilterCount}
									</Badge>
								)}
							</Button>
						</DrawerTrigger>
						<DrawerContent className="max-h-[85vh] flex flex-col">
							<DrawerHeader>
								<DrawerTitle>Filter</DrawerTitle>
								<DrawerDescription>
									Pilih negeri atau kategori untuk kecilkan senarai QR.
								</DrawerDescription>
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
									categoryCounts={categoryCounts}
								/>
							</div>
							<DrawerFooter>
								{isFiltered && <FilteredCount count={pagination.total} />}
								<div className="grid grid-cols-2 gap-2">
									<Button
										type="button"
										variant="outline"
										onClick={clearFilters}
										disabled={!isFiltered}
										className="gap-2"
									>
										<RotateCcw className="h-4 w-4" />
										Set semula
									</Button>
									<DrawerClose asChild>
										<Button type="button">Selesai</Button>
									</DrawerClose>
								</div>
							</DrawerFooter>
						</DrawerContent>
					</Drawer>
					<Button
						onClick={() => getLocation()}
						variant="outline"
						size="icon"
						disabled={isLocating}
						className="shrink-0"
						aria-label={
							isLocating
								? "Mencari institusi terdekat"
								: "Cari institusi terdekat"
						}
					>
						<LocateFixed className="h-4 w-4" />
					</Button>
					<Button
						onClick={toggleMap}
						variant="outline"
						size="icon"
						className="shrink-0"
						aria-label="Peta"
					>
						<MapIcon className="h-4 w-4" />
					</Button>
				</div>
			</div>

			<CollapsibleCustomMap
				isVisible={isMapVisible}
				showAll={true}
				filteredInstitutions={mapInstitutions}
			/>

			{isMapLoading && isMapVisible && (
				<div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
					Peta sedang memuatkan institusi...
				</div>
			)}

			{locationError && (
				<div className="mb-4 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground">
					{locationError}
				</div>
			)}

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
					{Array.from({ length: limit }).map((_, idx) => (
						<Card key={idx} className="aspect-square w-full">
							<Skeleton className="min-h-full min-w-full" />
						</Card>
					))}
				</div>
			) : displayedInstitutions.length === 0 ? (
				<div className="flex min-h-48 flex-col items-center justify-center gap-4 rounded-lg border bg-card p-6 text-center">
					<div className="space-y-1">
						<p className="text-sm font-semibold text-foreground">
							Tiada institusi dijumpai.
						</p>
						<p className="max-w-sm text-sm text-muted-foreground">
							Cuba kosongkan carian atau tapis semula senarai QR.
						</p>
					</div>
					<div className="flex flex-wrap justify-center gap-2">
						<Button type="button" variant="outline" onClick={clearFilters}>
							Set semula carian
						</Button>
						<Link href="/contribute">
							<Button type="button" variant="outline">
								Sumbang QR
							</Button>
						</Link>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
					{closestInstitution && (
						<InstitutionCard
							key={closestInstitution.id}
							{...closestInstitution}
							ref={
								displayedInstitutions.length === 0 ? lastPostElementRef : null
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

			{isLoadingMore && pagination.hasMore && (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
					{Array.from({ length: 9 }).map((_, idx) => (
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
