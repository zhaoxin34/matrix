#!/bin/bash

# CDP-LOG-010: 登录页跳转忘记密码页测试用例
# 测试步骤：在登录页点击"忘记密码？"链接
# 预期结果：页面跳转到忘记密码页面

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-LOG-010 登录页跳转忘记密码页测试 ==="

# 打开登录页面
echo -e "\n[1/3] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/3] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 点击"忘记密码？"链接
echo -e "\n[3/3] 点击'忘记密码？'链接..."
playwright-cli --config "$CONFIG_PATH" click e58

# 等待页面跳转
echo -e "\n等待页面跳转..."
sleep 2

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证页面是否跳转到忘记密码页面"

playwright-cli --config "$CONFIG_PATH" close
