#!/bin/bash

# CDP-REG-004: 注册页跳转登录页测试用例
# 测试步骤：在注册页点击"立即登录"链接
# 预期结果：页面跳转到登录页 http://localhost:3001/login

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-REG-004 注册页跳转登录页测试 ==="

# 打开注册页面
echo -e "\n[1/2] 打开注册页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/register

# 获取页面快照
echo -e "\n[获取页面快照]..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 点击"立即登录"链接
echo -e "\n[2/2] 点击'立即登录'链接..."
playwright-cli --config "$CONFIG_PATH" click e111

# 等待页面跳转
sleep 2

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否已跳转到 http://localhost:3001/login"

playwright-cli --config "$CONFIG_PATH" close
