import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-150",
	{
		variants: {
			variant: {
				default: "bg-[#1d9bf0]/15 text-[#1d9bf0] border border-[#1d9bf0]/20",
				secondary: "bg-[#8b98a5]/15 text-[#8b98a5] border border-[#8b98a5]/20",
				destructive:
					"bg-[#f4212e]/15 text-[#f4212e] border border-[#f4212e]/20",
				success: "bg-[#00c853]/15 text-[#00c853] border border-[#00c853]/20",
				warning: "bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20",
				outline: "border border-white/10 text-[#e7e9ea]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
