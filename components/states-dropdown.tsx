"use client"

import * as React from "react"
import { ChevronsUpDown, CheckIcon, X } from "lucide-react"

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
        value: "Johor",
    },
    {
        label: "Kedah",
        value: "Kedah",
    },
    {
        label: "Kelantan",
        value: "Kelantan",
    },
    {
        label: "Melaka",
        value: "Melaka",
    },
    {
        label: "Negeri Sembilan",
        value: "Negeri Sembilan",
    },
    {
        label: "Pahang",
        value: "Pahang",
    },
    {
        label: "Perak",
        value: "Perak",
    },
    {
        label: "Perlis",
        value: "Perlis",
    },
    {
        label: "Pulau Pinang",
        value: "Pulau Pinang",
    },
    {
        label: "Sabah",
        value: "Sabah",
    },
    {
        label: "Sarawak",
        value: "Sarawak",
    },
    {
        label: "Selangor",
        value: "Selangor",
    },
    {
        label: "Terengganu",
        value: "Terengganu",
    },
    {
        label: "W.P. Kuala Lumpur",
        value: "W.P. Kuala Lumpur",
    },
    {
        label: "W.P. Labuan",
        value: "W.P. Labuan",
    },
    {
        label: "W.P. Putrajaya",
        value: "W.P. Putrajaya",
    },
]

type Props = {
    onChange: (props: { state: string }) => void,
    className: string
};

export function StatesDropdown(props: Props) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")

    const handleSelect = (currentValue: string) => {
        setValue(currentValue === value ? '' : currentValue)
        setOpen(false)
        props.onChange({ state: currentValue === value ? '' : currentValue })
    }

    const handleReset = () => {
        setValue("")
        setOpen(false)
        props.onChange({ state: "" })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className={props.className}>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[200px] justify-between"
                >
                    <span className="truncate">
                        {value
                            ? states.find((state) => state.value === value)?.label
                            : "Semua Negeri"}
                    </span>
                    {value ? (
                        <X className="ml-2 h-4 w-4 shrink-0 opacity-50" onClick={(e) => {
                            e.stopPropagation() // Prevent dropdown dari buka balik
                            handleReset()
                        }} />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
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
                                    onSelect={handleSelect}
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
