/**
 * PopupLayout - Popup 上下布局组件
 *
 * 布局结构：
 * ┌──────────────────────────┐
 * │                          │
 * │       Content Area       │  ← <Content />
 * │                          │
 * ├──────────────────────────┤
 * │  [刷新登录信息] [设置]   │  ← <FooterActions />
 * └──────────────────────────┘
 */

import { RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export interface PopupLayoutProps {
	/** 内容区域 */
	content: ReactNode;
	/** 是否显示底部按钮（默认 true） */
	showFooter?: boolean;
	/** 刷新登录信息回调 */
	onRefreshAuth?: () => void;
	/** 刷新按钮加载状态 */
	isRefreshing?: boolean;
	/** 打开设置回调 */
	onOpenSettings?: () => void;
	/** 自定义 className */
	className?: string;
}

export function PopupLayout({
	content,
	showFooter = true,
	onRefreshAuth,
	isRefreshing = false,
	onOpenSettings,
	className,
}: PopupLayoutProps) {
	return (
		<div className={`popup-layout ${className ?? ""}`}>
			{/* Content Area */}
			<div className="popup-layout__content">{content}</div>

			{/* Footer Actions */}
			{showFooter && (
				<div className="popup-layout__footer">
					<Button
						variant="secondary"
						size="sm"
						onClick={onRefreshAuth}
						disabled={isRefreshing}
						className="flex-1 gap-1.5"
					>
						<RefreshCw
							className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
						/>
						刷新登录
					</Button>
					<Button
						variant="secondary"
						size="sm"
						onClick={onOpenSettings}
						className="flex-1 gap-1.5"
					>
						<Settings className="w-3.5 h-3.5" />
						设置
					</Button>
				</div>
			)}
		</div>
	);
}
