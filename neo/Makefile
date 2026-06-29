.PHONY: shutdown restart

# 关闭 neo 的 dev servers: backend(8000) / frontend(3000) / design(3200)
# 用 lsof 查端口占用的 PID,先 SIGTERM,1秒后还存活就 SIGKILL
# 端口未占用时静默跳过
shutdown:
	@echo "🔌 Shutting down neo dev servers..."
	@bash -c '\
	for entry in "8000:backend" "3000:frontend" "3200:design"; do \
		port="$${entry%%:*}"; \
		name="$${entry##*:}"; \
		pids=$$(lsof -ti :$$port 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			echo "  $$name (port $$port): killing PIDs $$pids"; \
			echo $$pids | xargs kill -TERM 2>/dev/null; \
			sleep 1; \
			leftover=$$(lsof -ti :$$port 2>/dev/null); \
			if [ -n "$$leftover" ]; then \
				echo "    force killing remaining: $$leftover"; \
				echo $$leftover | xargs kill -9 2>/dev/null; \
			fi; \
		else \
			echo "  $$name (port $$port): not running, skip"; \
		fi; \
	done'
	@echo "✅ Shutdown done"

# 重启:先 shutdown,再用 zellij 启动 backend/frontend/design 三个 pane
restart: shutdown
	@bash script/start.sh