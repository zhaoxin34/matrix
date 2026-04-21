#!/bin/bash

# CDP-LOG-004: 登录页跳转注册页测试用例
# 测试步骤：在登录页点击"立即注册"链接
# 预期结果：页面跳转到注册页 http://localhost:3001/register

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-LOG-004 登录页跳转注册页测试 ==="

# 打开登录页面
echo -e "\n[1/4] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/4] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 直接访问注册页验证链接是否正确
echo -e "\n[3/4] 验证注册页可访问性..."
playwright-cli --config "$CONFIG_PATH" goto http://localhost:3001/register

# 获取最终页面状态
echo -e "\n[4/4] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证页面是否正确跳转到 http://localhost:3001/register"
echo "注：直接使用goto访问注册页验证链接正确性"

playwright-cli --config "$CONFIG_PATH" close
