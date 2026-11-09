type MapPoint = { id: number; coords: [number, number] | null };

// Each point joins the first group whose centre is within `distance` pixels.
// Comparing against the centre, not any member, stops a line of neighbours
// from chaining into one district-wide group.
export function clusterMapPoints<T extends MapPoint>(
	points: T[],
	project: (coords: [number, number]) => { x: number; y: number },
	distance = 54,
): { points: T[]; coords: [number, number] }[] {
	const groups: {
		points: (T & { coords: [number, number] })[];
		x: number;
		y: number;
	}[] = [];
	for (const point of points) {
		if (point.coords === null) continue;
		const located = point as T & { coords: [number, number] };
		const pixel = project(located.coords);
		const group = groups.find(
			(candidate) =>
				Math.hypot(candidate.x - pixel.x, candidate.y - pixel.y) < distance,
		);
		if (!group) {
			groups.push({ points: [located], x: pixel.x, y: pixel.y });
			continue;
		}
		group.points.push(located);
		const n = group.points.length;
		group.x += (pixel.x - group.x) / n;
		group.y += (pixel.y - group.y) / n;
	}
	return groups.map((group) => ({
		points: group.points,
		coords: [
			group.points.reduce((sum, p) => sum + p.coords[0], 0) /
				group.points.length,
			group.points.reduce((sum, p) => sum + p.coords[1], 0) /
				group.points.length,
		],
	}));
}
