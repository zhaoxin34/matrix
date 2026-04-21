#!/bin/bash

# CDP-EDGE-003: 特殊字符输入
# 测试步骤：
#   1. 在输入框输入特殊字符（如 <script>alert('xss')</script>）
#   2. 提交表单
# 预期结果：系统正确处理特殊字符，不执行脚本代码

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

# 特殊字符/XSS测试字符串
SPECIAL_TEXT="<script>alert('xss')</script>"

echo "=== CDP-EDGE-003 特殊字符输入测试 ==="

# 1. 打开登录页
echo "[1/7] 打开登录页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001/login
sleep 3

# 2. 获取页面快照
echo "[2/7] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 3. 输入特殊字符
echo "[3/7] 输入特殊字符..."
playwright-cli --config "$CONFIG_PATH" fill e37 "$SPECIAL_TEXT"

# 4. 填写密码
echo "[4/7] 填写密码..."
playwright-cli --config "$CONFIG_PATH" fill e48 "abcd1234"

# 5. 获取页面状态
echo "[5/7] 获取页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

# 6. 点击登录按钮
echo "[6/7] 点击登录按钮..."
playwright-cli --config "$CONFIG_PATH" click e59
sleep 3

# 7. 获取最终页面状态
echo "[7/7] 获取最终页面状态..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查系统是否正确处理特殊字符，没有执行脚本代码"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
