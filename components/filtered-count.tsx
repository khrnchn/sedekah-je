import { AnimatePresence, motion } from "framer-motion";
import { Filter } from "lucide-react";

type FilteredCountProps = {
	count: number;
};

const FilteredCount = ({ count }: FilteredCountProps) => {
	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -20 }}
				transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
				aria-live="polite"
			>
				<div className="rounded-md border border-border/45 bg-card px-3 py-2 shadow-sm">
					<div className="flex items-center justify-between gap-4">
						<div className="flex items-center space-x-2 text-muted-foreground">
							<Filter size={16} />
							<span className="text-sm font-medium">Jumlah hasil tapisan</span>
						</div>
						<span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-semibold tabular-nums text-secondary-foreground">
							{count}
						</span>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default FilteredCount;
