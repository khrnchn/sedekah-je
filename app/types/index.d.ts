type Mosque = {
	name: string;
	location: string;
	image: string;
};

type GetDoaResponse = {
	name_my: string;
	name_en: string;
	content: string;
	reference_my: string;
	reference_en: string;
	meaning_my: string;
	meaning_en: string;
	category_names: Array<string>;
};
