"use client";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Check, ChevronsUpDown, UserPlusIcon, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { assignContributorToInstitution } from "../_lib/queries";

type User = {
	id: string;
	name: string | null;
	email: string;
	username: string | null;
};

type AssignContributorDialogProps = {
	institutionId: number;
	institutionName: string;
	currentContributorId: string | null;
	currentContributorName: string | null;
	users: User[];
};

export function AssignContributorDialog({
	institutionId,
	institutionName,
	currentContributorId,
	currentContributorName,
	users,
}: AssignContributorDialogProps) {
	const [open, setOpen] = useState(false);
	const [comboboxOpen, setComboboxOpen] = useState(false);
	const [selectedContributorId, setSelectedContributorId] = useState<
		string | null
	>(currentContributorId);
	const [searchValue, setSearchValue] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleAssign = () => {
		startTransition(async () => {
			try {
				await assignContributorToInstitution(
					institutionId,
					selectedContributorId,
				);
				setOpen(false);
			} catch (error) {
				console.error("Failed to assign contributor:", error);
			}
		});
	};

	const getDisplayName = (user: User) => {
		return user.name || user.username || user.email;
	};

	const selectedUser = users.find((user) => user.id === selectedContributorId);
	const selectedDisplayName = selectedUser
		? getDisplayName(selectedUser)
		: null;

	// Filter users based on search value
	const filteredUsers = users.filter((user) => {
		const searchLower = searchValue.toLowerCase();
		const name = getDisplayName(user).toLowerCase();
		const email = user.email.toLowerCase();
		return name.includes(searchLower) || email.includes(searchLower);
	});

	const dialogContentRef = useRef<HTMLDivElement>(null);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<UserPlusIcon className="h-4 w-4 mr-1" />
					{currentContributorName ? "Reassign" : "Assign"}
				</Button>
			</DialogTrigger>
			<DialogContent ref={dialogContentRef}>
				<DialogHeader>
					<DialogTitle>Assign Contributor</DialogTitle>
					<DialogDescription>
						Assign a contributor to "{institutionName}". The assigned user will
						be credited for this contribution.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<div className="space-y-4">
						<div>
							<div className="text-sm font-medium mb-2">Select Contributor</div>
							<Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										aria-expanded={comboboxOpen}
										className="w-full justify-between"
									>
										{selectedDisplayName || "Select a contributor..."}
										<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
									</Button>
								</PopoverTrigger>
								<PopoverPrimitive.Portal container={dialogContentRef.current}>
									<PopoverPrimitive.Content
										className="w-[400px] p-0 z-50 rounded-md border bg-popover text-popover-foreground shadow-md outline-none"
										align="start"
										side="bottom"
									>
										<Command shouldFilter={false}>
											<CommandInput
												placeholder="Search contributors..."
												className="h-9"
												value={searchValue}
												onValueChange={setSearchValue}
												autoFocus
											/>
											<CommandList>
												{filteredUsers.length === 0 && searchValue && (
													<CommandEmpty>No contributor found.</CommandEmpty>
												)}
												<CommandGroup>
													{!searchValue && (
														<CommandItem
															value="none"
															onSelect={() => {
																setSelectedContributorId(null);
																setComboboxOpen(false);
																setSearchValue("");
															}}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	selectedContributorId === null
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															<div className="flex items-center">
																<X className="mr-2 h-4 w-4 text-muted-foreground" />
																No contributor
															</div>
														</CommandItem>
													)}
													{filteredUsers.map((user) => (
														<CommandItem
															key={user.id}
															value={`${getDisplayName(user)} ${user.email}`}
															onSelect={() => {
																setSelectedContributorId(user.id);
																setComboboxOpen(false);
																setSearchValue("");
															}}
														>
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	selectedContributorId === user.id
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															<div className="flex flex-col">
																<span className="font-medium">
																	{getDisplayName(user)}
																</span>
																<span className="text-xs text-muted-foreground">
																	{user.email}
																</span>
															</div>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverPrimitive.Content>
								</PopoverPrimitive.Portal>
							</Popover>
						</div>
						{currentContributorName && (
							<div className="text-sm text-muted-foreground">
								Current contributor: {currentContributorName}
							</div>
						)}
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleAssign} disabled={isPending}>
						{isPending ? "Assigning..." : "Assign"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
