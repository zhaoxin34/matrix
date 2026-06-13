import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					"flex h-10 w-full rounded-lg border border-white/10 bg-[#2f3336]/50 px-3 py-2 text-sm text-[#e7e9ea] ring-offset-background transition-all duration-150 placeholder:text-[#8b98a5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0]/50 focus-visible:border-[#1d9bf0]/50 disabled:cursor-not-allowed disabled:opacity-50",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
