"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
	onChange: (props: { state: string }) => void;
	className?: string;
};

export function StatesDropdown({ onChange, className }: Props) {
	const [value, setValue] = React.useState(ALL_STATES);

	const handleSelect = (currentValue: string) => {
		setValue(currentValue);
		onChange({ state: currentValue === ALL_STATES ? "" : currentValue });
	};

	return (
		<Select value={value} onValueChange={handleSelect}>
			<SelectTrigger className={cn("", className)}>
				<SelectValue placeholder="Semua Negeri" />
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
									<Image
										src={state.flag}
										alt={`${state.label} flag`}
										width={20}
										height={12}
										className="object-contain"
									/>
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
	);
}
