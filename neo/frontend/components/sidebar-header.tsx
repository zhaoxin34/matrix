"use client";

import { useEffect, useState } from "react";
import { Bot, ChevronDown, Loader2 } from "lucide-react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { getRootOrgUnits } from "@/lib/api/organization";
import type { OrgUnitResponse } from "@/types/organization";

export function SidebarHeaderComponent() {
	const [orgUnits, setOrgUnits] = useState<OrgUnitResponse[]>([]);
	const [selectedOrg, setSelectedOrg] = useState<OrgUnitResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function loadOrgUnits() {
			try {
				const units = await getRootOrgUnits("active");
				setOrgUnits(units);
				if (units.length > 0 && !selectedOrg) {
					setSelectedOrg(units[0]);
				}
			} catch (err) {
				console.error("Failed to load org units:", err);
			} finally {
				setIsLoading(false);
			}
		}
		loadOrgUnits();
	}, []);

	return (
		<SidebarHeader>
			<SidebarMenu>
				<SidebarMenuItem>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton className="h-auto flex-col items-start gap-1 p-2">
								<div className="flex w-full items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
										<Bot className="h-4 w-4" />
									</div>
									<div className="flex flex-col gap-0.5 leading-none">
										<span className="font-semibold">
											{isLoading ? (
												<Loader2 className="h-3 w-3 animate-spin" />
											) : (
												selectedOrg?.name || "选择组织"
											)}
										</span>
										<span className="text-xs text-muted-foreground">
											{selectedOrg?.code || "AI Platform"}
										</span>
									</div>
									<ChevronDown className="ml-auto h-4 w-4 text-muted-foreground" />
								</div>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							align="start"
							className="w-[--radix-popper-anchor-width]"
						>
							{orgUnits.map((unit) => (
								<DropdownMenuItem
									key={unit.id}
									onClick={() => setSelectedOrg(unit)}
								>
									<span>{unit.name}</span>
								</DropdownMenuItem>
							))}
						</DropdownMenuContent>
					</DropdownMenu>
				</SidebarMenuItem>
			</SidebarMenu>
		</SidebarHeader>
	);
}
