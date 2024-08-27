"use client";

import * as React from "react";

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

const states = [
	{ label: "Johor", value: "Johor" },
	{ label: "Kedah", value: "Kedah" },
	{ label: "Kelantan", value: "Kelantan" },
	{ label: "Melaka", value: "Melaka" },
	{ label: "Negeri Sembilan", value: "Negeri Sembilan" },
	{ label: "Pahang", value: "Pahang" },
	{ label: "Perak", value: "Perak" },
	{ label: "Perlis", value: "Perlis" },
	{ label: "Pulau Pinang", value: "Pulau Pinang" },
	{ label: "Sabah", value: "Sabah" },
	{ label: "Sarawak", value: "Sarawak" },
	{ label: "Selangor", value: "Selangor" },
	{ label: "Terengganu", value: "Terengganu" },
	{ label: "W.P. Kuala Lumpur", value: "W.P. Kuala Lumpur" },
	{ label: "W.P. Labuan", value: "W.P. Labuan" },
	{ label: "W.P. Putrajaya", value: "W.P. Putrajaya" },
];

type Props = {
	onChange: (props: { state: string }) => void;
	className?: string;
};

export function StatesDropdown({ onChange, className }: Props) {
	const [value, setValue] = React.useState("");

	const handleSelect = (currentValue: string) => {
		setValue(currentValue);
		onChange({ state: currentValue });
	};

	return (
		<Select value={value} onValueChange={handleSelect}>
			<SelectTrigger className={cn("", className)}>
				<SelectValue placeholder="Semua Negeri" />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Senarai Negeri</SelectLabel>
					{states.map((state) => (
						<SelectItem key={state.value} value={state.value}>
							{state.label}
						</SelectItem>
					))}
				</SelectGroup>
			</SelectContent>
		</Select>
	);
}
