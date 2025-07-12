"use client";

import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { useEffect } from "react";

interface QRProcessorProps {
	onQrContentChange: (content: string | null) => void;
	onStatusChange: (status: {
		qrExtracting: boolean;
		qrExtractionFailed: boolean;
		hasAttemptedExtraction: boolean;
	}) => void;
	onHandleFileChange: (
		handler: (event: React.ChangeEvent<HTMLInputElement>) => void,
	) => void;
	onClearQrContent: (clearFn: () => void) => void;
}

export function QRProcessor({
	onQrContentChange,
	onStatusChange,
	onHandleFileChange,
	onClearQrContent,
}: QRProcessorProps) {
	const {
		qrContent,
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		handleQrImageChange,
		clearQrContent,
	} = useQrExtractionLazy();

	// Update parent with QR content changes
	useEffect(() => {
		onQrContentChange(qrContent);
	}, [qrContent, onQrContentChange]);

	// Update parent with status changes
	useEffect(() => {
		onStatusChange({
			qrExtracting,
			qrExtractionFailed,
			hasAttemptedExtraction,
		});
	}, [
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		onStatusChange,
	]);

	// Provide file change handler to parent
	useEffect(() => {
		onHandleFileChange(handleQrImageChange);
	}, [handleQrImageChange, onHandleFileChange]);

	// Provide clear function to parent
	useEffect(() => {
		onClearQrContent(clearQrContent);
	}, [clearQrContent, onClearQrContent]);

	return null; // This component only handles logic, no UI
}
