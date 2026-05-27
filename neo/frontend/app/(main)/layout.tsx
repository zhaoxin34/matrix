import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppHeader } from "@/components/header";

export default function MainLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ThemeProvider>
			<TooltipProvider>
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>
						<AppHeader />
						<main className="flex-1 p-6">{children}</main>
					</SidebarInset>
				</SidebarProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}
