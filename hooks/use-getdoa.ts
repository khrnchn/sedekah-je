import type { GetDoaResponse } from "@/app/types";
import { useQuery } from "@tanstack/react-query";

// In case GetDoa API went down, use this mock data
export const mockGetDoa: GetDoaResponse = {
	name_my: "[JEMAAH] Mohon Kurniaan dan Rahmat-Nya",
	name_en: "[JAMA'AH] Seeking His Blessings and Mercy",
	content: "اللهم إنا نسألك من فضلك ورحمتك، فإنه لا يملكها إلا أنت",
	reference_my:
		"Riwayat al-Tabarani dalam al-Mu'jam al-Kabir (10379) dan Abu Nu'aim dalam Hilyah al-Auliya' (7/280). Hadith ini dihukumkan sebagai sahih oleh pengarang kitab al-Silsilah al-Sahihah.",
	reference_en:
		"Narrated by al-Tabarani in al-Mu'jam al-Kabir (10379) and Abu Nu'aim in Hilyah al-Auliya' (7/280). This hadith is classified as authentic by the author of al-Silsilah al-Sahihah.",
	meaning_my:
		"Ya Allah, sesungguhnya kami memohon kepada-Mu agar diberi kurniaan dan rahmat-Mu. Sesungguhnya tiada yang memilikinya kecuali-Mu.",
	meaning_en:
		"O Allah, we ask You for Your blessings and mercy. Indeed, no one possesses them except You",
	category_names: ["Kurniaan", "Blessings", "Rahmat", "Mercy", "Jamaah"],
};

export const useGetDoa = () => {
	return useQuery<GetDoaResponse>({
		queryKey: ["get-doa"],
		queryFn: async () => {
			const response = await fetch("/api/getdoa/random", {
				cache: "no-cache",
			});

			if (!response.ok) {
				console.error("Failed to fetch GetDoa API", response);
				return mockGetDoa;
			}

			const json: GetDoaResponse = await response.json();
			return json;
		},
		retry: 2,
		refetchOnWindowFocus: false,
	});
};
