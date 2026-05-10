import React, { useState } from "react";
import Layout from "@theme/Layout";

const MODES = {
	"mode-switch": {
		title: "模式切换流程",
		description: "点击 Agent Icon → 弹出模式菜单 → 选择进入",
	},
	learning: {
		title: "学习模式界面",
		description: "记录用户操作、行为统计、Chat 打断",
	},
	guiding: {
		title: "引导模式界面",
		description: "全屏遮罩 + rrweb 录像播放 + Agent 讲解",
	},
	executing: {
		title: "主动模式界面",
		description: "目标设定 + 操作步骤 + 实时高亮",
	},
};

export default function AgentPrototype() {
	const [activeMode, setActiveMode] = useState("mode-switch");

	return (
		<Layout
			title="Agent 嵌入 - UI 原型"
			description="Agent 嵌入功能的低保真原型"
		>
			<div
				style={{
					minHeight: "100vh",
					padding: "20px",
					width: "1200px",
					margin: "0 auto",
					boxSizing: "border-box",
					overflowX: "hidden",
				}}
			>
				<div
					style={{
						marginBottom: "24px",
						padding: "16px 20px",
						background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
						borderRadius: "12px",
						color: "white",
						display: "flex",
						alignItems: "center",
						gap: "24px",
						boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
					}}
				>
					<span style={{ fontSize: "24px" }}>🔗</span>
					<div style={{ flex: 1 }}>
						<div
							style={{ fontSize: "12px", opacity: 0.8, marginBottom: "4px" }}
						>
							相关文档
						</div>
						<div>
							<a
								href="/docs/product/agent-ingest"
								style={{
									color: "white",
									textDecoration: "none",
									padding: "6px 12px",
									background: "rgba(255,255,255,0.2)",
									borderRadius: "6px",
									marginRight: "12px",
									fontSize: "14px",
								}}
							>
								📄 产品需求文档
							</a>
							<a
								href="/docs/ui-design/prototype-agent-ingest"
								style={{
									color: "white",
									textDecoration: "none",
									padding: "6px 12px",
									background: "rgba(255,255,255,0.2)",
									borderRadius: "6px",
									fontSize: "14px",
								}}
							>
								🎨 UI 设计文档
							</a>
						</div>
					</div>
				</div>

				<h1>Agent 嵌入 - UI 原型</h1>
				<p style={{ color: "#666", marginBottom: "24px" }}>
					低保真线框图，用于验证交互流程和界面布局
				</p>

				{/* 模式选择标签 */}
				<div
					style={{
						display: "flex",
						gap: "8px",
						marginBottom: "24px",
						flexWrap: "wrap",
					}}
				>
					{Object.entries(MODES).map(([key, value]) => (
						<button
							key={key}
							onClick={() => setActiveMode(key)}
							style={{
								padding: "8px 16px",
								border:
									activeMode === key ? "2px solid #007AFF" : "1px solid #ddd",
								borderRadius: "8px",
								background: activeMode === key ? "#007AFF" : "white",
								color: activeMode === key ? "white" : "#333",
								cursor: "pointer",
								fontSize: "14px",
							}}
						>
							{value.title}
						</button>
					))}
				</div>

				{/* iframe 预览 */}
				<div
					style={{
						border: "1px solid #ddd",
						borderRadius: "12px",
						overflow: "hidden",
						boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
					}}
				>
					<iframe
						src={`/prototype/index.html?mode=${activeMode}`}
						style={{
							width: "100%",
							height: "600px",
							border: "none",
							display: "block",
						}}
						title={MODES[activeMode].title}
					/>
				</div>

				{/* 说明文字 */}
				<div
					style={{
						marginTop: "24px",
						padding: "16px",
						background: "#f5f5f5",
						borderRadius: "8px",
					}}
				>
					<h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
						{MODES[activeMode].title}
					</h3>
					<p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
						{MODES[activeMode].description}
					</p>
				</div>

				{/* 设计决策表 */}
				<div style={{ marginTop: "32px", overflowX: "auto" }}>
					<h2 style={{ fontSize: "20px", marginBottom: "16px" }}>设计决策</h2>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ background: "#f5f5f5" }}>
								<th
									style={{
										padding: "12px",
										textAlign: "left",
										border: "1px solid #ddd",
									}}
								>
									决策点
								</th>
								<th
									style={{
										padding: "12px",
										textAlign: "left",
										border: "1px solid #ddd",
									}}
								>
									方案
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									UI 形态
								</td>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									浮动 Icon + 弹出菜单
								</td>
							</tr>
							<tr>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									视觉风格
								</td>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									轻量浮层（半透明、毛玻璃）
								</td>
							</tr>
							<tr>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									引导模式遮罩
								</td>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									全屏遮罩 + 操作区域高亮
								</td>
							</tr>
							<tr>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									Chat 打断
								</td>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									支持随时打断
								</td>
							</tr>
							<tr>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									主动模式
								</td>
								<td style={{ padding: "12px", border: "1px solid #ddd" }}>
									Agent 直接操作，用户实时可见
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</Layout>
	);
}
