import type React from "react";
import { useEffect } from "react";

export const useOutsideClick = (
	ref: React.RefObject<HTMLDivElement>,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	callback: (event: any) => void,
) => {
	useEffect(() => {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const listener = (event: any) => {
			if (!ref.current || ref.current.contains(event.target)) {
				return;
			}
			callback(event);
		};

		document.addEventListener("mousedown", listener);
		document.addEventListener("touchstart", listener);

		return () => {
			document.removeEventListener("mousedown", listener);
			document.removeEventListener("touchstart", listener);
		};
	}, [ref, callback]);
};
