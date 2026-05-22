"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
	Search01Icon,
	ChevronRight,
	ChevronDown,
} from "@hugeicons/core-free-icons";
import type { SelectablePrototype } from "@/components/agent-factory/agent-factory-types";
import { PrototypeOptionItem } from "./prototype-option-item";

export { type PrototypePickerProps } from "./types";

interface PrototypePickerProps {
	prototypes: SelectablePrototype[];
	selectedPrototype: SelectablePrototype | null;
	onSelect: (prototypeId: number, version: string) => void;
}

export function PrototypePicker({
	prototypes,
	selectedPrototype,
	onSelect,
}: PrototypePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedPrototypeId, setExpandedPrototypeId] = useState<number | null>(
		null,
	);
	const ref = useRef<HTMLDivElement>(null);

	// 过滤原型
	const filteredPrototypes = useMemo(() => {
		if (!searchQuery.trim()) return prototypes;
		const query = searchQuery.toLowerCase();
		return prototypes.filter(
			(p) =>
				p.name.toLowerCase().includes(query) ||
				p.code.toLowerCase().includes(query),
		);
	}, [prototypes, searchQuery]);

	// 点击外部关闭
	useEffect(() => {
		if (!isOpen) return;
		const handleClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				setIsOpen(false);
				setExpandedPrototypeId(null);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	const handlePrototypeClick = useCallback(
		(prototype: SelectablePrototype) => {
			if (expandedPrototypeId === prototype.id) {
				setExpandedPrototypeId(null);
			} else {
				setExpandedPrototypeId(prototype.id);
				onSelect(prototype.id, "latest");
			}
		},
		[expandedPrototypeId, onSelect],
	);

	const handleVersionClick = useCallback(
		(prototype: SelectablePrototype, version: string) => {
			onSelect(prototype.id, version);
			setIsOpen(false);
			setExpandedPrototypeId(null);
			setSearchQuery("");
		},
		[onSelect],
	);

	// 计算按钮显示文本
	const triggerText = selectedPrototype
		? `${selectedPrototype.name} (v${selectedPrototype.current_version})`
		: "请选择原型...";

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant={selectedPrototype ? "default" : "outline"}
					className="w-full justify-start text-left font-normal"
				>
					<span className={selectedPrototype ? "" : "text-muted-foreground"}>
						{triggerText}
					</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[480px] p-0" align="start">
				<div className="p-3 border-b">
					<div className="relative">
						<HugeiconsIcon
							icon={Search01Icon}
							strokeWidth={1.5}
							className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
						/>
						<Input
							placeholder="搜索原型..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
							autoFocus
						/>
					</div>
				</div>
				<div className="max-h-80 overflow-y-auto py-1" ref={ref}>
					{filteredPrototypes.length === 0 ? (
						<div className="px-4 py-8 text-center text-sm text-muted-foreground">
							{searchQuery ? "未找到匹配的原型" : "暂无可选原型"}
						</div>
					) : (
						filteredPrototypes.map((prototype) => (
							<PrototypeOptionItem
								key={prototype.id}
								prototype={prototype}
								isExpanded={expandedPrototypeId === prototype.id}
								onPrototypeClick={() => handlePrototypeClick(prototype)}
								onVersionClick={(version) =>
									handleVersionClick(prototype, version)
								}
							/>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
