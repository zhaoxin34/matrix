import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
	{
		variants: {
			variant: {
				default:
					"bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] hover:shadow-lg hover:shadow-[#1d9bf0]/20 hover:-translate-y-0.5",
				destructive:
					"bg-[#f4212e] text-white hover:bg-[#dc1e28] hover:shadow-lg hover:shadow-[#f4212e]/20 hover:-translate-y-0.5",
				success:
					"bg-[#00c853] text-white hover:bg-[#00b84a] hover:shadow-lg hover:shadow-[#00c853]/20 hover:-translate-y-0.5",
				outline:
					"border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20 active:scale-[0.98]",
				secondary:
					"bg-[#2f3336] text-[#e7e9ea] hover:bg-[#3f4449] active:scale-[0.98]",
				ghost: "hover:bg-white/5 active:scale-[0.98]",
				link: "text-[#1d9bf0] underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3 text-xs",
				lg: "h-11 rounded-lg px-6 text-base",
				icon: "h-10 w-10 rounded-lg",
				"icon-sm": "h-8 w-8 rounded-md",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
