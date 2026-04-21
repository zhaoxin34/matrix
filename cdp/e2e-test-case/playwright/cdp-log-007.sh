#!/bin/bash

# CDP-LOG-007: 登录功能-用户不存在测试用例
# 测试步骤：
#   1. 输入一个未注册的用户名
#   2. 输入任意密码
#   3. 点击登录按钮
# 预期结果：显示错误提示，提示用户名或密码错误

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"
# 使用时间戳生成一个不存在的用户名
NOT_EXIST_USER="notexist$(date +%H%M%S)"
PASSWORD="abcd1234"

echo "=== CDP-LOG-007 登录功能-用户不存在测试 ==="
echo "测试用户名: $NOT_EXIST_USER"

# 打开登录页面
echo -e "\n[1/5] 打开登录页面..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login

# 获取页面快照
echo -e "\n[2/5] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 填写不存在的用户名
echo -e "\n[3/5] 填写不存在的用户名..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$NOT_EXIST_USER"

# 填写密码
echo -e "\n[4/5] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "$PASSWORD"

# 点击登录按钮
echo -e "\n[5/5] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59

# 等待页面响应
echo -e "\n等待页面响应..."
sleep 2

# 获取最终页面状态
echo -e "\n[验证] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo "=== 测试完成 ==="
echo "请验证是否显示错误提示，提示用户名或密码错误"

playwright-cli --config "$CONFIG_PATH" close
