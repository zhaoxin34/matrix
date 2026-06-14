/**
 * SettingsView - 设置页面
 */

import { useState } from "react";
import { Settings2, Globe, Server, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Config } from "@/lib/storage";

interface SettingsViewProps {
	config: Config;
	onSave: (config: Config) => void;
	onCancel: () => void;
}

export function SettingsView({ config, onSave, onCancel }: SettingsViewProps) {
	const [neoUrl, setNeoUrl] = useState(config.neoUrl);
	const [backendUrl, setBackendUrl] = useState(config.backendUrl);
	const [testMode] = useState(config.testMode ?? true);
	const [errors, setErrors] = useState<{ neo?: string; backend?: string }>({});

	const validateUrl = (url: string): boolean => {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	};

	const handleSave = () => {
		const newErrors: { neo?: string; backend?: string } = {};

		if (!validateUrl(neoUrl)) {
			newErrors.neo = "请输入有效的 URL";
		}

		if (!validateUrl(backendUrl)) {
			newErrors.backend = "请输入有效的 URL";
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		setErrors({});
		onSave({ neoUrl, backendUrl, testMode });
	};

	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<div className="flex items-center gap-2">
				<div className="w-8 h-8 rounded-lg bg-[#1d9bf0]/10 flex items-center justify-center">
					<Settings2 className="w-4 h-4 text-[#1d9bf0]" />
				</div>
				<h2 className="text-base font-semibold">设置</h2>
			</div>

			<Card className="p-4">
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label
							htmlFor="neo-url"
							className="flex items-center gap-2 text-xs text-[#8b98a5]"
						>
							<Globe className="w-3.5 h-3.5" />
							Neo 前端地址
						</Label>
						<Input
							id="neo-url"
							type="text"
							value={neoUrl}
							onChange={(e) => {
								setNeoUrl(e.target.value);
								setErrors((prev) => ({ ...prev, neo: undefined }));
							}}
							placeholder="http://localhost:3000"
							className={
								errors.neo ? "border-[#f4212e] focus:border-[#f4212e]" : ""
							}
						/>
						{errors.neo && (
							<p className="text-xs text-[#f4212e]">{errors.neo}</p>
						)}
					</div>

					<div className="flex flex-col gap-2">
						<Label
							htmlFor="backend-url"
							className="flex items-center gap-2 text-xs text-[#8b98a5]"
						>
							<Server className="w-3.5 h-3.5" />
							后端服务地址
						</Label>
						<Input
							id="backend-url"
							type="text"
							value={backendUrl}
							onChange={(e) => {
								setBackendUrl(e.target.value);
								setErrors((prev) => ({ ...prev, backend: undefined }));
							}}
							placeholder="http://localhost:8002"
							className={
								errors.backend ? "border-[#f4212e] focus:border-[#f4212e]" : ""
							}
						/>
						{errors.backend && (
							<p className="text-xs text-[#f4212e]">{errors.backend}</p>
						)}
					</div>
				</div>
			</Card>

			<div className="flex gap-2">
				<Button variant="secondary" onClick={onCancel} className="flex-1 gap-2">
					<X className="w-4 h-4" />
					取消
				</Button>
				<Button onClick={handleSave} className="flex-1 gap-2">
					<Save className="w-4 h-4" />
					保存
				</Button>
			</div>
		</div>
	);
}
