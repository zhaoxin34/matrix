/**
 * 认证状态 Hook
 */

import { useState, useEffect } from "react";
import { logger } from "@/common/logger";
import {
	DEFAULT_CONFIG,
	TEST_USER_INFO,
	setAuthUserInfo,
} from "@/common/storage";
import { fetchAuthState, type UserInfo } from "@/common/auth";

export interface AuthState {
	isAuthenticated: boolean;
	isWorkspaceSelected: boolean;
	userInfo: UserInfo | null;
}

interface UseAuthStateReturn {
	authState: AuthState;
	isLoading: boolean;
	retryAuth: () => Promise<void>;
}

export function useAuthState(): UseAuthStateReturn {
	const [authState, setAuthState] = useState<AuthState>({
		isAuthenticated: false,
		isWorkspaceSelected: false,
		userInfo: null,
	});
	const [isLoading, setIsLoading] = useState(true);

	const retryAuth = async () => {
		logger.ui.debug("retryAuth: 重试认证");
		const auth = await fetchAuthState();
		setAuthState({
			isAuthenticated: auth.isAuthenticated,
			isWorkspaceSelected: auth.isWorkspaceSelected,
			userInfo: auth.userInfo,
		});
	};

	useEffect(() => {
		const init = async () => {
			setIsLoading(true);

			if (DEFAULT_CONFIG.testMode) {
				logger.ui.debug("useAuthState: 测试模式已启用");
				const testUserInfo = {
					...TEST_USER_INFO,
					acquiredAt: Date.now(),
				};
				setAuthState({
					isAuthenticated: true,
					isWorkspaceSelected: true,
					userInfo: testUserInfo,
				});
				// 同步保存到 chrome.storage.local，供 SW 上传时使用
				await setAuthUserInfo(testUserInfo);
			} else {
				const auth = await fetchAuthState();
				setAuthState({
					isAuthenticated: auth.isAuthenticated,
					isWorkspaceSelected: auth.isWorkspaceSelected,
					userInfo: auth.userInfo,
				});
				// 同步保存到 chrome.storage.local，供 SW 上传时使用
				if (auth.userInfo) {
					await setAuthUserInfo(auth.userInfo);
				}
			}

			setIsLoading(false);
		};

		init();
	}, []);

	return { authState, isLoading, retryAuth };
}
