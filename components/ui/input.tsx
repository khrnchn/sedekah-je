import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	startIcon?: LucideIcon;
	endIcon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, startIcon, endIcon, disabled, ...props }, ref) => {
		const StartIcon = startIcon;
		const EndIcon = endIcon;

		return (
			<div
				className={cn(
					"flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-card px-3 shadow-sm ring-offset-background transition-colors duration-200 ease-out",
					"focus-within:border-ring focus-within:outline-none focus-within:ring-2 focus-within:ring-ring/20 focus-within:ring-offset-0",
					className,
				)}
			>
				{StartIcon && (
					<StartIcon
						className="pointer-events-none size-[18px] shrink-0 text-muted-foreground"
						aria-hidden
					/>
				)}
				<input
					type={type}
					className={cn(
						"min-h-0 min-w-0 flex-1 border-0 bg-transparent p-0 text-sm leading-normal text-foreground",
						"file:border-0 file:bg-transparent file:text-sm file:font-medium",
						"placeholder:text-muted-foreground",
						"shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
						"disabled:cursor-not-allowed disabled:opacity-50",
					)}
					ref={ref}
					disabled={disabled}
					{...props}
				/>
				{EndIcon && (
					<EndIcon
						className="pointer-events-none size-[18px] shrink-0 text-muted-foreground"
						aria-hidden
					/>
				)}
			</div>
		);
	},
);
Input.displayName = "Input";

export { Input };
