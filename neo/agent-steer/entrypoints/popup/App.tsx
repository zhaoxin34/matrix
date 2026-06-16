/**
 * App - Popup 主组件
 *
 * 布局：上下结构
 * - 上：Content 区域（AuthRequiredView / RecordingUI / SettingsView）
 * - 下：固定底部按钮（刷新登录、设置）
 */

import { useState, useCallback, useEffect } from "react";
import { RecordingUI } from "@/src/recordingv2";
import { PopupLayout } from "./components/PopupLayout";
import { SettingsView } from "@/views/popup/SettingsView";
import { AuthRequiredView } from "@/views/popup/AuthRequiredView";
import { DEFAULT_CONFIG, getConfig, setAuthUserInfo } from "@/common/storage";
import type { Config } from "@/common/storage";
import { fetchAuthState, type UserInfo } from "@/common/auth";
import "./App.css";

export type AppView = "recording" | "settings" | "auth-required";

function App() {
	const [view, setView] = useState<AppView>("auth-required");
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
	const [authState, setAuthState] = useState<{
		isAuthenticated: boolean;
		isWorkspaceSelected: boolean;
		userInfo: UserInfo | null;
	}>({
		isAuthenticated: false,
		isWorkspaceSelected: false,
		userInfo: null,
	});

	// 初始化：获取配置和认证状态
	useEffect(() => {
		const init = async () => {
			// 获取配置
			const savedConfig = await getConfig();
			setConfig(savedConfig);

			// 通过 iframe 获取认证状态（内部已处理 testMode）
			const auth = await fetchAuthState();
			setAuthState({
				isAuthenticated: auth.isAuthenticated,
				isWorkspaceSelected: auth.isWorkspaceSelected,
				userInfo: auth.userInfo,
			});

			// 把 userInfo 同步到 chrome.storage（v2 CS 需读 token / workspaceCode）
			if (auth.userInfo) {
				await setAuthUserInfo(auth.userInfo);
			}

			// 根据认证状态决定视图
			if (auth.isAuthenticated && auth.isWorkspaceSelected) {
				setView("recording");
			} else {
				setView("auth-required");
			}
		};

		init();
	}, []);

	// 刷新登录信息
	const handleRefreshAuth = useCallback(async () => {
		setIsRefreshing(true);

		const auth = await fetchAuthState();
		setAuthState({
			isAuthenticated: auth.isAuthenticated,
			isWorkspaceSelected: auth.isWorkspaceSelected,
			userInfo: auth.userInfo,
		});

		if (auth.isAuthenticated && auth.isWorkspaceSelected) {
			setView("recording");
		} else {
			setView("auth-required");
		}

		setIsRefreshing(false);
	}, []);

	// 打开设置
	const handleOpenSettings = useCallback(() => {
		setView("settings");
	}, []);

	// 关闭设置
	const handleCloseSettings = useCallback(() => {
		// 返回之前的视图
		if (authState.isAuthenticated && authState.isWorkspaceSelected) {
			setView("recording");
		} else {
			setView("auth-required");
		}
	}, [authState]);

	// 保存设置
	const handleSaveSettings = useCallback(
		async (newConfig: Config) => {
			console.log("[App] Settings saved:", newConfig);
			setConfig(newConfig);

			// 返回之前的视图
			if (authState.isAuthenticated && authState.isWorkspaceSelected) {
				setView("recording");
			} else {
				setView("auth-required");
			}
		},
		[authState],
	);

	// 打开 Neo
	const handleOpenNeo = useCallback(() => {
		window.open(config.neoUrl, "_blank");
	}, [config.neoUrl]);

	// 渲染内容
	const renderContent = () => {
		if (view === "settings") {
			return (
				<SettingsView
					config={config}
					onSave={handleSaveSettings}
					onCancel={handleCloseSettings}
				/>
			);
		}

		if (view === "auth-required") {
			const errorType = authState.isAuthenticated
				? "noWorkspace"
				: "notLoggedIn";
			return (
				<AuthRequiredView
					onOpenNeo={handleOpenNeo}
					onRetry={handleRefreshAuth}
					onOpenSettings={handleOpenSettings}
					errorType={errorType}
				/>
			);
		}

		return <RecordingUI />;
	};

	return (
		<PopupLayout
			content={renderContent()}
			onRefreshAuth={handleRefreshAuth}
			isRefreshing={isRefreshing}
			onOpenSettings={handleOpenSettings}
		/>
	);
}

export default App;
