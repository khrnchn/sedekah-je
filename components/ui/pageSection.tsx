import { cn } from "@/lib/utils";
import type React from "react";
import { type ComponentProps, type ForwardedRef, forwardRef } from "react";

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
					"max-w-5xl mx-auto px-4 lg:px-6 flex flex-col gap-4 sm:gap-6 lg:gap-8",
					"pb-8 sm:pb-12 lg:pb-16", // Add bottom padding
					className,
				)}
				{...rest}
			/>
		);
	},
);

PageSection.displayName = "PageSection";

export default PageSection;
