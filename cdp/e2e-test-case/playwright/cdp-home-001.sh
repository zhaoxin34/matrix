#!/bin/bash

# CDP-HOME-001: 首页正常加载
# 测试步骤：打开浏览器访问 http://localhost:3001
# 预期结果：
#   - 页面正确加载
#   - 显示平台名称或Logo
#   - 导航栏显示主要菜单项
#   - 页面包含核心功能入口

set -e

CONFIG_PATH="$PROJECT_DIR/playwright-config.json"

echo "=== CDP-HOME-001 首页正常加载测试 ==="

# 打开首页
echo -e "\n[1/2] 打开首页..."
playwright-cli --config "$CONFIG_PATH" open http://localhost:3001

# 等待页面加载
sleep 3

# 获取页面快照以确认页面元素
echo -e "\n[2/2] 获取页面快照..."
playwright-cli --config "$CONFIG_PATH" snapshot

echo -e "\n=== 测试完成 ==="
echo "请检查页面是否包含："
echo "  - 平台名称或Logo"
echo "  - 导航栏"
echo "  - 核心功能入口"

# 关闭浏览器
playwright-cli --config "$CONFIG_PATH" close

echo "测试脚本执行完毕"
