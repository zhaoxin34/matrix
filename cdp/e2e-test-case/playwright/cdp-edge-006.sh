#!/bin/bash

# CDP-EDGE-006: Session过期处理
# 测试步骤：在Session过期后进行操作
# 预期结果：系统提示登录或自动跳转登录页

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-EDGE-006 Session过期处理测试 ==="

echo "[说明] 此测试需要模拟Session过期"

# 1. 打开首页
echo "[1/5] 打开首页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001
sleep 3

# 2. 获取页面快照
echo "[2/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 3. 清除Session数据模拟过期
echo "[3/5] 清除Session数据..."
playwright-cli --config "$CONFIG_PATH" delete-data
sleep 2

# 4. 刷新页面
echo "[4/5] 刷新页面..."
playwright-cli --config "$CONFIG_PATH" reload
sleep 3

# 5. 获取页面快照
echo "[5/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查系统是否提示登录或自动跳转到登录页"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
