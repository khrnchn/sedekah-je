import { readFile } from "node:fs/promises";
import { join } from "node:path";

let fontsPromise:
	| Promise<
			{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[]
	  >
	| undefined;

/** Bundle fonts locally so image generation doesn't depend on a font service. */
export function getOgFonts() {
	fontsPromise ??= Promise.all(
		(
			[
				["Poppins-Regular.ttf", 400],
				["Poppins-Bold.ttf", 700],
			] as const
		).map(async ([file, weight]) => {
			const buffer = await readFile(
				join(process.cwd(), "public/fonts/poppins", file),
			);
			return {
				name: "Poppins",
				data: buffer.buffer.slice(
					buffer.byteOffset,
					buffer.byteOffset + buffer.byteLength,
				) as ArrayBuffer,
				weight,
				style: "normal" as const,
			};
		}),
	);
	return fontsPromise;
}
