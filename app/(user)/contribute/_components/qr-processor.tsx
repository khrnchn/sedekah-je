"use client";

import { useQrExtractionLazy } from "@/hooks/use-qr-extraction-lazy";
import { useEffect, useRef } from "react";

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

	const isInitialized = useRef(false);
	const lastQrContent = useRef(qrContent);
	const lastStatus = useRef({
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
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
		};

		if (
			lastStatus.current.qrExtracting !== currentStatus.qrExtracting ||
			lastStatus.current.qrExtractionFailed !==
				currentStatus.qrExtractionFailed ||
			lastStatus.current.hasAttemptedExtraction !==
				currentStatus.hasAttemptedExtraction
		) {
			onStatusChange(currentStatus);
			lastStatus.current = currentStatus;
		}
	}, [
		qrExtracting,
		qrExtractionFailed,
		hasAttemptedExtraction,
		onStatusChange,
	]);

	// Provide handlers to parent only once
	useEffect(() => {
		if (!isInitialized.current) {
			onHandleFileChange(handleQrImageChange);
			onClearQrContent(clearQrContent);
			isInitialized.current = true;
		}
	}, [
		handleQrImageChange,
		onHandleFileChange,
		clearQrContent,
		onClearQrContent,
	]);

	return null; // This component only handles logic, no UI
}
