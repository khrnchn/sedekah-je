"use client"

import * as React from "react"
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const states = [
    {
        label: "Johor",
        value: "johor",
    },
    {
        label: "Kedah",
        value: "kedah",
    },
    {
        label: "Kelantan",
        value: "kelantan",
    },
    {
        label: "Melaka",
        value: "melaka",
    },
    {
        label: "Negeri Sembilan",
        value: "negeri-sembilan",
    },
    {
        label: "Pahang",
        value: "pahang",
    },
    {
        label: "Perak",
        value: "perak",
    },
    {
        label: "Perlis",
        value: "perlis",
    },
    {
        label: "Pulau Pinang",
        value: "pulau-pinang",
    },
    {
        label: "Sabah",
        value: "sabah",
    },
    {
        label: "Sarawak",
        value: "sarawak",
    },
    {
        label: "Selangor",
        value: "selangor",
    },
    {
        label: "Terengganu",
        value: "terengganu",
    },
    {
        label: "W.P. Kuala Lumpur",
        value: "kuala-lumpur",
    },
    {
        label: "W.P. Labuan",
        value: "labuan",
    },
    {
        label: "W.P. Putrajaya",
        value: "putrajaya",
    },
]

type Props = {
    onChange: (props: {
        state: string;
    }) => void;
};

export function StatesDropdown(props: Props, { widthFull = false }) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    return (
        <Popover open={open} onOpenChange={setOpen} >
            <PopoverTrigger asChild className={widthFull ? "min-w-full" : ""}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    {value
                        ? states.find((state) => state.value === value)?.label
                        : "Semua Negeri"}
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
                <Command>
                    <CommandInput placeholder="Search state..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>Tiada negeri dijumpai.</CommandEmpty>
                        <CommandGroup>
                            {states.map((state) => (
                                <CommandItem
                                    key={state.value}
                                    value={state.value}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue === value ? '' : currentValue)
                                        setOpen(false)
                                        props.onChange({ state: currentValue === value ? '' : currentValue })
                                    }}
                                >
                                    {state.label}
                                    <CheckIcon
                                        className={cn(
                                            "ml-auto h-4 w-4",
                                            value === state.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
