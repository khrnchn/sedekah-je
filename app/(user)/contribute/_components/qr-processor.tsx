"use client";

import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { useEffect, useRef } from "react";

interface QRProcessorProps {
	onQrContentChange: (content: string | null) => void;
	onStatusChange: (status: {
		qrExtracting: boolean;
		qrExtractionFailed: boolean;
		hasAttemptedExtraction: boolean;
		hasFile: boolean;
	}) => void;
	onHandleFileChange: (
		handler: (event: React.ChangeEvent<HTMLInputElement>) => void,
	) => void;
	onClearQrContent: (clearFn: () => void) => void;
	hasFile: boolean;
}

export function QRProcessor({
	onQrContentChange,
	onStatusChange,
	onHandleFileChange,
	onClearQrContent,
	hasFile,
}: QRProcessorProps) {
	const {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		handleQrImageChange,
		clearQrContent,
	} = useQrExtractionLazy();

	const lastQrContent = useRef(qrContent);
	const lastStatus = useRef({
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		hasFile,
	});

	// Update parent with QR content changes only when content actually changes
	useEffect(() => {
		if (lastQrContent.current !== qrContent) {
			onQrContentChange(qrContent);
			lastQrContent.current = qrContent;
		}
	}, [qrContent, onQrContentChange]);

	// Update parent with status changes only when status actually changes
	useEffect(() => {
		const currentStatus = {
			qrExtracting,
			qrExtractionFailed,
			hasAttemptedExtraction,
			hasFile: hasFile, // Preserve hasFile from parent
		};

		if (
			lastStatus.current.qrExtracting !== currentStatus.qrExtracting ||
			lastStatus.current.qrExtractionFailed !==
				currentStatus.qrExtractionFailed ||
			lastStatus.current.hasAttemptedExtraction !==
				currentStatus.hasAttemptedExtraction ||
			lastStatus.current.hasFile !== currentStatus.hasFile
		) {
			onStatusChange(currentStatus);
			lastStatus.current = currentStatus;
		}
	}, [
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		hasFile,
		onStatusChange,
	]);

	// Provide handlers to parent
	useEffect(() => {
		onHandleFileChange(handleQrImageChange);
		onClearQrContent(clearQrContent);
	}, [
		handleQrImageChange,
		onHandleFileChange,
		clearQrContent,
		onClearQrContent,
	]);

	return null; // This component only handles logic, no UI
}
