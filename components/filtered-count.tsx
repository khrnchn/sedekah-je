import { AnimatePresence, motion } from "framer-motion";
import { Filter } from "lucide-react";
import type React from "react";

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
				transition={{ duration: 0.3 }}
			>
				<div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-2 shadow-sm">
					<div className="flex items-center justify-between">
						<div className="flex items-center text-blue-700 dark:text-blue-300 space-x-2">
							<Filter size={16} />
							<span className="text-sm font-medium">Jumlah hasil tapisan</span>
						</div>
						<span className="text-lg font-bold text-blue-800 dark:text-blue-200">
							{count}
						</span>
					</div>
				</div>
			</motion.div>
		</AnimatePresence>
	);
};

export default FilteredCount;
