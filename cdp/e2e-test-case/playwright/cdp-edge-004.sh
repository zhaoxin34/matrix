#!/bin/bash

# CDP-EDGE-004: 快速切换页面
# 测试步骤：快速在不同页面之间切换
# 预期结果：页面正确加载，不出现异常或错误状态

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-EDGE-004 快速切换页面测试 ==="

# 1. 打开首页
echo "[1/10] 打开首页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001
sleep 1
echo "[2/10] 首页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 2. 切换到登录页
echo "[3/10] 切换到登录页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/login
sleep 1
echo "[4/10] 登录页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 3. 切换到注册页
echo "[5/10] 切换到注册页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/register
sleep 1
echo "[6/10] 注册页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 4. 切换回首页
echo "[7/10] 切换回首页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001
sleep 1
echo "[8/10] 首页快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 5. 切换到登录页
echo "[9/10] 切换到登录页..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/login
sleep 1
echo "[10/10] 最终检查..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否正确加载，没有出现异常或错误状态"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
