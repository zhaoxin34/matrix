"use client";

import { useState } from "react";
import { UserSelectorV2 } from "@/components/user-selector-v2";

interface TestUser {
	id: number;
	phone: string;
	username?: string;
	is_active: boolean;
}

export default function ComponentsPage() {
	const [selectorOpen, setSelectorOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<TestUser | null>(null);

	const handleUserSelect = (user: TestUser) => {
		console.log("[Components Page] User selected:", user);
		setSelectedUser(user);
	};

	return (
		<div className="container mx-auto py-10">
			<h1 className="text-2xl font-bold mb-8">组件测试页面</h1>

			<div className="space-y-8">
				{/* UserSelectorV2 测试 */}
				<section className="border rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-4">UserSelectorV2</h2>

					<div className="flex items-center gap-4 mb-4">
						<span>当前选中用户:</span>
						{selectedUser ? (
							<span className="font-mono">
								{selectedUser.phone} - {selectedUser.username || "(无用户名)"}
							</span>
						) : (
							<span className="text-muted-foreground">无</span>
						)}
					</div>

					<button
						onClick={() => setSelectorOpen(true)}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						打开选择器
					</button>

					<UserSelectorV2
						open={selectorOpen}
						onOpenChange={setSelectorOpen}
						onSelect={handleUserSelect}
					/>
				</section>
			</div>
		</div>
	);
}
