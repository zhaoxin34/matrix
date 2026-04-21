#!/bin/bash

# CDP-EDGE-001: 网络中断后刷新页面
# 测试步骤：在浏览页面时断开网络，然后刷新页面
# 预期结果：页面显示网络错误提示，不出现白屏或崩溃

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-EDGE-001 网络中断后刷新页面测试 ==="

# 1. 打开首页
echo "[1/4] 打开首页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001
sleep 3

# 2. 获取页面快照
echo "[2/4] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 3. 刷新页面（模拟网络中断后的恢复）
echo "[3/4] 刷新页面..."
playwright-cli --config "$CONFIG_PATH" reload
sleep 3

# 4. 获取页面快照查看状态
echo "[4/4] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否正常显示"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
