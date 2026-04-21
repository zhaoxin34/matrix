#!/usr/bin/env python3
"""
CDP-LOG-002: 错误密码登录失败测试用例
测试步骤：
  1. 打开浏览器访问 http://localhost:3001/login
  2. 输入正确的用户名和错误的密码
  3. 点击登录按钮
预期结果：
  1. 登录失败
  2. 显示错误提示信息
"""

import subprocess
import time
import os

# 配置
PROJECT_DIR = os.environ.get("PROJECT_DIR", "/Volumes/data/working/ai/matrix")
CONFIG_PATH = f"{PROJECT_DIR}/playwright-config.json"
USERNAME = "13800138002"
WRONG_PASSWORD = "wrongpassword123"

# 从文件名获取 session 名称
SCRIPT_NAME = os.path.splitext(os.path.basename(__file__))[0]  # cdp-log-002


def run_playwright(args: list[str]) -> subprocess.CompletedProcess:
    """执行 playwright-cli 命令"""
    cmd = ["playwright-cli", f"-s={SCRIPT_NAME}", "--config", CONFIG_PATH] + args
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    print("=== CDP-LOG-002 错误密码登录失败测试 ===")

    try:
        # 1. 打开登录页面
        print("\n[1/5] 打开登录页面...")
        result = run_playwright(["open", "http://localhost:3001/login"])
        print(result.stdout)

        # 2. 获取页面快照
        print("\n[2/5] 获取页面快照...")
        result = run_playwright(["snapshot"])
        print(result.stdout)

        # 3. 填写用户名
        print("\n[3/5] 填写用户名...")
        result = run_playwright(["fill", "e37", USERNAME])
        print(result.stdout)

        # 4. 填写错误密码
        print("\n[4/5] 填写错误密码...")
        result = run_playwright(["fill", "e48", WRONG_PASSWORD])
        print(result.stdout)

        # 5. 点击登录按钮
        print("\n[5/5] 点击登录按钮...")
        result = run_playwright(["click", "e59"])
        print(result.stdout)

        # 等待页面响应
        print("\n等待页面响应...")
        time.sleep(2)

        # 6. 获取最终页面状态
        print("\n[验证] 获取最终页面状态...")
        result = run_playwright(["snapshot"])
        print(result.stdout)

        print("=== 测试完成 ===")
        print("请验证：")
        print("  1. 是否显示错误提示信息")
        print("  2. 是否仍停留在登录页")

    finally:
        # 关闭浏览器 - 确保始终执行
        print("\n关闭浏览器...")
        run_playwright(["close"])


if __name__ == "__main__":
    main()
