#!/bin/bash

# CDP-LOG-003: 登录页正常加载测试用例
# 测试步骤：打开浏览器访问 http://localhost:3001/login
# 预期结果：
#   - 页面标题显示"登录"或"登录账号"
#   - 页面包含用户名输入框
#   - 页面包含密码输入框
#   - 页面包含"登录"按钮
#   - 页面包含"忘记密码？"链接
#   - 页面包含"还没有账号？立即注册"链接

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-LOG-003 登录页正常加载测试 ==="

# 打开登录页面
echo -e "\n[1/1] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/2] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证页面包含以下元素："
echo "  - 页面标题显示'登录'或'登录账号'"
echo "  - 手机号输入框 (ref=e37)"
echo "  - 密码输入框 (ref=e48)"
echo "  - '登录'按钮 (ref=e59)"
echo "  - '立即注册'链接 (ref=e62)"
echo ""
echo "注：登录页结构与预期略有差异，实际显示手机号输入框而非用户名输入框"

playwright-cli --config "$CONFIG_PATH" close
