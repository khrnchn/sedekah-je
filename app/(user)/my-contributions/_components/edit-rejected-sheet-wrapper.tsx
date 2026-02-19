"use client";

import { getInstitutionForEdit } from "@/app/(user)/my-contributions/_lib/queries";
import { useCallback, useEffect, useState } from "react";
import { EditInstitutionSheet } from "./edit-institution-sheet";

interface EditRejectedSheetWrapperProps {
	editInstitutionId: string | null;
	onClose: () => void;
}

export function EditRejectedSheetWrapper({
	editInstitutionId,
	onClose,
}: EditRejectedSheetWrapperProps) {
	const [institution, setInstitution] = useState<Awaited<
		ReturnType<typeof getInstitutionForEdit>
	> | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const open = !!editInstitutionId;

	useEffect(() => {
		if (!editInstitutionId) {
			setInstitution(null);
			return;
		}

		let cancelled = false;
		setIsLoading(true);
		setInstitution(null);

		getInstitutionForEdit(editInstitutionId)
			.then((data) => {
				if (!cancelled) {
					setInstitution(data);
				}
			})
			.finally(() => {
				if (!cancelled) {
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [editInstitutionId]);

	const handleOpenChange = useCallback(
		(isOpen: boolean) => {
			if (!isOpen) {
				onClose();
			}
		},
		[onClose],
	);

	if (!open) {
		return null;
	}

	return (
		<EditInstitutionSheet
			institution={institution}
			open={open}
			onOpenChange={handleOpenChange}
			onSuccess={onClose}
			isLoading={isLoading}
		/>
	);
}
