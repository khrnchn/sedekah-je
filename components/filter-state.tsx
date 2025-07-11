import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Image from "next/image";
import type React from "react";
import { useState } from "react";

const ALL_STATES = "all_states";

const states = [
	{ label: "Semua Negeri", value: ALL_STATES, flag: null },
	{ label: "Johor", value: "Johor", flag: "/flags/Johor.svg" },
	{ label: "Kedah", value: "Kedah", flag: "/flags/Kedah.svg" },
	{ label: "Kelantan", value: "Kelantan", flag: "/flags/Kelantan.svg" },
	{ label: "Melaka", value: "Melaka", flag: "/flags/Melaka.svg" },
	{
		label: "Negeri Sembilan",
		value: "Negeri Sembilan",
		flag: "/flags/Negeri-Sembilan.svg",
	},
	{ label: "Pahang", value: "Pahang", flag: "/flags/Pahang.svg" },
	{ label: "Perak", value: "Perak", flag: "/flags/Perak.svg" },
	{ label: "Perlis", value: "Perlis", flag: "/flags/Perlis.svg" },
	{
		label: "Pulau Pinang",
		value: "Pulau Pinang",
		flag: "/flags/Pulau-Pinang.svg",
	},
	{ label: "Sabah", value: "Sabah", flag: "/flags/Sabah.svg" },
	{ label: "Sarawak", value: "Sarawak", flag: "/flags/Sarawak.svg" },
	{ label: "Selangor", value: "Selangor", flag: "/flags/Selangor.svg" },
	{ label: "Terengganu", value: "Terengganu", flag: "/flags/Terengganu.svg" },
	{
		label: "W.P. Kuala Lumpur",
		value: "W.P. Kuala Lumpur",
		flag: "/flags/WP-Kuala-Lumpur.svg",
	},
	{ label: "W.P. Labuan", value: "W.P. Labuan", flag: "/flags/WP-Labuan.svg" },
	{
		label: "W.P. Putrajaya",
		value: "W.P. Putrajaya",
		flag: "/flags/WP-Putrajaya.svg",
	},
];

type Props = {
	onStateChange: (state: string) => void;
	className?: string;
	initialState?: string;
};

const FilterState = ({ onStateChange, className, initialState }: Props) => {
	// Convert empty string to ALL_STATES for display, but keep actual state value
	const initialValue =
		initialState && initialState !== "" ? initialState : ALL_STATES;
	const [selectedState, setSelectedState] = useState<string>(initialValue);

	const handleStateChange = (currentValue: string) => {
		const newState = currentValue === ALL_STATES ? "" : currentValue;
		setSelectedState(currentValue);
		onStateChange(newState);
	};

	return (
		<div className={cn("w-full", className)}>
			<Select value={selectedState} onValueChange={handleStateChange}>
				<SelectTrigger className="rounded-lg border">
					<SelectValue placeholder="" />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						{states.map((state) => (
							<SelectItem
								key={state.value}
								value={state.value}
								className="flex items-center"
							>
								{state.flag ? (
									<div className="flex items-center space-x-3 w-full">
										<div className="relative overflow-hidden border border-gray-200">
											<Image
												loading="lazy"
												src={state.flag}
												alt={`${state.label} flag`}
												width={32}
												height={18}
												className="object-cover"
											/>
										</div>
										<span>{state.label}</span>
									</div>
								) : (
									<span>{state.label}</span>
								)}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
};

export default FilterState;
