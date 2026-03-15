import type React from "react";
import { type ComponentProps, type ForwardedRef, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Props = ComponentProps<"section"> & {
	children: React.ReactNode;
};

const PageSection = forwardRef(
	(props: Props, ref: ForwardedRef<HTMLElement | null>) => {
		const { className, ...rest } = props;

		return (
			<section
				ref={ref}
				className={cn(
					"max-w-5xl mx-auto px-4 lg:px-6 flex flex-col gap-2 lg:gap-4",
					"pt-2 sm:pt-4 lg:pt-6 pb-8 sm:pb-12 lg:pb-16",
					className,
				)}
				{...rest}
			/>
		);
	},
);

PageSection.displayName = "PageSection";

export default PageSection;
