/**
 * SuccessView - 上传成功
 */

import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { logger } from "@/common/logger";

interface SuccessViewProps {
	onViewPlayback: () => void;
	neoUrl?: string;
	workspaceCode?: string;
	recordingUid?: string;
}

export function SuccessView({
	onViewPlayback,
	neoUrl,
	workspaceCode,
	recordingUid,
}: SuccessViewProps) {
	const playbackUrl =
		neoUrl && workspaceCode && recordingUid
			? `${neoUrl.replace(/\/$/, "")}/workspace/${workspaceCode}/recordings/${recordingUid}/play`
			: null;

	const handleClick = () => {
		logger.ui.info("SuccessView: 点击查看回放", { playbackUrl });
		if (playbackUrl) {
			browser.tabs.create({ url: playbackUrl });
		}
		onViewPlayback();
	};

	return (
		<div className="flex flex-col gap-4 p-4 animate-fade-in">
			<Card className="p-5 border-[#00c853]/20 bg-[#00c853]/5">
				<div className="flex flex-col gap-4 items-center text-center">
					<div className="w-14 h-14 rounded-2xl bg-[#00c853]/10 flex items-center justify-center relative">
						<CheckCircle2 className="w-8 h-8 text-[#00c853]" />
					</div>
					<div className="space-y-1">
						<h3 className="font-semibold text-[#00c853]">上传成功</h3>
						<p className="text-xs text-[#8b98a5]">录像已成功保存到服务器</p>
					</div>
				</div>
			</Card>

			<Button
				onClick={handleClick}
				disabled={!playbackUrl}
				className="w-full gap-2"
				size="lg"
			>
				查看回放
				<ArrowRight className="w-4 h-4" />
			</Button>

			<p className="text-xs text-center text-[#8b98a5] pb-2">
				{playbackUrl
					? "点击按钮在新窗口中查看录像回放"
					: "回放链接不可用,请刷新后重试"}
			</p>
		</div>
	);
}
