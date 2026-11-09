type TourStop = { id: number; name: string; coords: [number, number] | null };

// Greedy nearest-neighbour walk from the westmost mosque, so "next" on a phone
// is always close by. Unmapped mosques can't be placed, so they go last A to Z.
export function questTour(mosques: TourStop[]): number[] {
	const remaining = mosques.filter(
		(m): m is TourStop & { coords: [number, number] } => m.coords !== null,
	);
	const order: number[] = [];
	let current = remaining.reduce<(typeof remaining)[number] | null>(
		(west, m) => (west === null || m.coords[1] < west.coords[1] ? m : west),
		null,
	);
	while (current) {
		const here: [number, number] = current.coords;
		order.push(current.id);
		remaining.splice(remaining.indexOf(current), 1);
		// Degree distance is fine for ordering inside one district.
		current = remaining.reduce<(typeof remaining)[number] | null>(
			(best, m) =>
				best === null ||
				Math.hypot(m.coords[0] - here[0], m.coords[1] - here[1]) <
					Math.hypot(best.coords[0] - here[0], best.coords[1] - here[1])
					? m
					: best,
			null,
		);
	}
	const unmapped = mosques
		.filter((m) => m.coords === null)
		.sort((a, b) => a.name.localeCompare(b.name));
	return [...order, ...unmapped.map((m) => m.id)];
}
