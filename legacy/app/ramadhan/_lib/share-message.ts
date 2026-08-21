/** Plain share text for Ramadan campaign days (no decorative emoji). */
export function buildRamadhanShareMessage(opts: {
	headline: string;
	institutionName: string;
	institutionState: string;
	url: string;
}) {
	const { headline, institutionName, institutionState, url } = opts;
	return `${headline}\n\n${institutionName} (${institutionState})\n\n${url}\n\n#SedekahJe #30Hari30QR`;
}
