import { useGetDoa, mockGetDoa } from "@/hooks/use-getdoa";

const GetdoaFooter = () => {
	const { data, isFetching } = useGetDoa();

	return (
		<footer className="bg-card w-full p-5 md:p-10 flex items-center justify-center shadow-lg dark:shadow-muted/50 cursor-pointer hover:shadow-xl transition-shadow duration-200 ease-in-out hover:bg-gray-100 dark:hover:bg-zinc-900">
			{isFetching ? (
				<div className="flex flex-col items-center w-full">
					<div className="self-start animate-pulse w-64 md:w-96 h-6 bg-zinc-400 rounded-md mb-2" />
					<div className="self-end animate-pulse w-64 md:w-96 h-6 bg-zinc-400 rounded-md mb-2" />
					<div className="self-start animate-pulse w-64 md:w-96 h-6 bg-zinc-400 rounded-md mb-2" />
					<div className="self-start animate-pulse w-64 md:w-96 h-6 bg-zinc-400 rounded-md mb-2" />
				</div>
			) : data ? (
				<div className="flex flex-col w-full">
					<h1 className="text-sm md:text-md font-bold">{data.name_my}</h1>
					<h1 className="text-sm md:text-md text-right">{data.content}</h1>
					<h1 className="text-[8px] md:text-xs text-zinc-400">
						{data.reference_my}
					</h1>
					<h1 className="text-xs md:text-sm">{data.meaning_my}</h1>
				</div>
			) : (
				<div className="flex flex-col w-full">
					<h1 className="text-sm md:text-md font-bold">{mockGetDoa.name_my}</h1>
					<h1 className="text-sm md:text-md text-right">
						{mockGetDoa.content}
					</h1>
					<h1 className="text-[8px] md:text-xs text-zinc-400">
						{mockGetDoa.reference_my}
					</h1>
					<h1 className="text-xs md:text-sm">{mockGetDoa.meaning_my}</h1>
				</div>
			)}
		</footer>
	);
};

export default GetdoaFooter;
