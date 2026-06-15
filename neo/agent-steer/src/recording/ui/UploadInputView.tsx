/**
 * UploadInputView - 上传前输入录像名称
 */

import { useState } from "react";
import { Upload, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface UploadInputViewProps {
	onConfirm: (name: string) => void;
	onCancel: () => void;
}

export function UploadInputView({ onConfirm, onCancel }: UploadInputViewProps) {
	const [name, setName] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (name.trim()) {
			onConfirm(name.trim());
		}
	};

	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-4">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-lg bg-[#1d9bf0]/10 flex items-center justify-center">
							<Upload className="w-4 h-4 text-[#1d9bf0]" />
						</div>
						<span className="text-sm font-medium text-[#e7e9ea]">上传录像</span>
					</div>

					<div className="flex flex-col gap-1.5">
						<label className="text-xs text-[#8b98a5]">录像名称</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="输入录像名称"
							autoFocus
							className="bg-[#2f3336] border-white/10 focus:border-[#1d9bf0]"
						/>
					</div>
				</form>
			</Card>

			<div className="flex gap-2">
				<Button
					type="button"
					variant="secondary"
					onClick={onCancel}
					className="flex-1 gap-2"
				>
					<ArrowLeft className="w-4 h-4" />
					返回
				</Button>
				<Button
					type="submit"
					onClick={handleSubmit}
					disabled={!name.trim()}
					className="flex-1 gap-2"
				>
					确认上传
				</Button>
			</div>
		</div>
	);
}
