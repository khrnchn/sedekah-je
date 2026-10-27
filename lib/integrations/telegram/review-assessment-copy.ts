import {
	type Assessment,
	inspectDuitNow,
} from "@/lib/features/institution-review/telegram-evidence";

const UNVERIFIED_RECIPIENT_CONFLICT =
	"Locally decoded DuitNow recipient is unavailable or invalid; image text alone cannot confirm ownership.";

function imageDescription(type: Assessment["imageType"]): string {
	switch (type) {
		case "physical_photo":
			return "Photo of a physical display";
		case "digital_artwork":
			return "Digital graphic";
		case "screenshot":
			return "Screenshot";
		case "unclear":
			return "Image type unclear";
	}
}

function visibleLocation(text: string): string {
	if (!text.trim()) return "Not visible";
	if (
		/^(?:no (?:address|location|city|state)|not visible|none visible|not shown)\b/i.test(
			text.trim(),
		)
	)
		return "Not visible";
	return text;
}

export function assessmentCardSummary(
	assessment: Assessment,
	qrContent: string | null,
): string {
	const qr = inspectDuitNow(qrContent);
	if (!qr.valid)
		return `AI: ${imageDescription(assessment.imageType)}. Check QR recipient.`;
	if (assessment.recipientRelationship === "individual")
		return `AI: ${imageDescription(assessment.imageType)}. Recipient may be a person.`;
	if (assessment.recipientRelationship === "unclear")
		return `AI: ${imageDescription(assessment.imageType)}. Confirm recipient ownership.`;
	return `AI: ${imageDescription(assessment.imageType)}. Confirm evidence before approval.`;
}

export function assessmentCardDetails(assessment: Assessment): string[] {
	const concern = assessment.conflicts
		.filter((conflict) => conflict !== UNVERIFIED_RECIPIENT_CONFLICT)
		.join("; ");
	return [
		`Name shown: ${(assessment.visibleInstitution || "Not readable").slice(0, 90)}`,
		`Location shown: ${visibleLocation(assessment.visibleLocation).slice(0, 90)}`,
		...(concern ? [`Concern: ${concern.slice(0, 140)}`] : []),
	];
}

export function formatAssessmentReport(input: {
	id: number;
	name: string;
	category: string;
	qrContent: string | null;
	assessment: Assessment;
}): string {
	const { id, name, category, assessment } = input;
	const qr = inspectDuitNow(input.qrContent);
	const needsPhysicalPhoto =
		(category === "masjid" || category === "surau") &&
		assessment.imageType !== "physical_photo";
	const needsOfficialSource =
		(category === "kebajikan" || category === "tahfiz") &&
		assessment.imageType !== "physical_photo";
	const status = !qr.valid
		? "Needs a QR check before approval"
		: assessment.recipientRelationship === "individual"
			? "Possible personal recipient — do not approve yet"
			: needsPhysicalPhoto
				? "Needs a photo of the QR on site"
				: needsOfficialSource
					? "Needs an official source check"
					: "Review evidence before approval";
	const recipient = !qr.valid
		? "Not verified"
		: assessment.recipientRelationship === "individual"
			? `${qr.recipient} — may be a person's account`
			: assessment.recipientRelationship === "unclear"
				? `${qr.recipient} — ownership unclear`
				: `${qr.recipient} — confirm it belongs to the institution`;
	const next = !qr.valid
		? "Choose Retry/replace QR, then confirm the recipient and saved location."
		: assessment.recipientRelationship === "individual"
			? "Check the recipient. Do not approve a personal account."
			: needsPhysicalPhoto
				? "A photo of the QR displayed at the mosque or surau is needed before approval."
				: needsOfficialSource
					? "Check the official source URL, then confirm the recipient and location."
					: "Confirm the recipient, location and duplicate checks before approval.";
	const concerns = assessment.conflicts.filter(
		(conflict) => conflict !== UNVERIFIED_RECIPIENT_CONFLICT,
	);
	return [
		`#${id} · ${name}`,
		status,
		"",
		`Photo: ${imageDescription(assessment.imageType)}`,
		`Name shown: ${assessment.visibleInstitution || "Not readable"}`,
		`Location shown: ${visibleLocation(assessment.visibleLocation)}`,
		`Payment recipient: ${recipient}`,
		...(concerns.length ? [`Other concerns: ${concerns.join("; ")}`] : []),
		"",
		`Open /find ${id} → ${next}`,
		"AI photo check only. You decide.",
	].join("\n");
}

export function formatAssessmentUnavailable(id: number): string {
	return `Photo check #${id} could not finish. Open /find ${id} to review manually or choose Retry analysis. You can still approve or reject after checking the evidence.`;
}
