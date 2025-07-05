interface ShareData {
	files?: File[];
	title?: string;
	text?: string;
	url?: string;
}

interface Navigator {
	share?: (data: ShareData) => Promise<void>;
	canShare?: (data: ShareData) => boolean;
}
