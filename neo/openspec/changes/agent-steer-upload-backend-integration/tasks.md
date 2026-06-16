# Tasks: agent-steer 录制上传到 Neo 后端

## 1. 清理 spike 临时钩子

- [x] 1.1 删除 `sw/communicator.ts` 中的 `spike-start-upload` message handler
- [x] 1.2 删除 `sw/communicator.ts` 中的 `self.__spike_start_upload` 赋值
- [x] 1.3 删除 `sw/communicator.ts` 中的 `self.__spike_upload_logs` 缓存 + onMessage 里的 push 逻辑
- [x] 1.4 删除 `sw/communicator.ts` 中的 `spike-set-auth` message handler

## 2. 后端 CORS 放宽

- [x] 2.1 修改 `backend/src/app/main.py` 的 CORSMiddleware 配置为 `allow_origins=["*"]` + `allow_credentials=False`
- [x] 2.2 验证前端 `localhost:3000` 仍能正常调用后端 API（双保险：cookie + Bearer token）

## 3. CS 端上传核心

- [x] 3.1 完善 `cs/commands.ts.handleUpload()`：
  - 通过 `db.getUnsyncedSegments()` 读 segments
  - 调用 `POST /api/v1/workspaces/{wsCode}/recordings` 创建 recording
  - 循环：对每个 segment 调用 `PUT /.../segments/{segUid}/bytes` + `POST /.../segments`
  - 调用 `POST /.../complete`
  - 失败时推送 `status: "failed"` 带 error
- [x] 3.2 完善 `cs/state.ts.pushUploadProgress()` helper（已有 spike 版本，确认字段）
- [x] 3.3 token 来源：从 `chrome.storage.local.get("auth.userInfo")` 读取（spike 已做）

## 4. SW 端命令路由

- [x] 4.1 改造 `sw/communicator.ts.startUpload()`：
  - 读 token from chrome.storage.local（spike 已做）
  - 转发 upload-cmd 到当前 tab 的 CS（spike 已做）
  - 不写 STORAGE_KEYS.UPLOAD_CMD（去掉 spike 残留）
  - 不更新 uploadState（spike 残留，CS 会通过 upload-progress 推）
  - 检测非 http tab 返回错误

## 5. UI 收尾

- [x] 5.1 改造 `ui/hooks/useUploadState.ts`：
  - 去掉对 `sw.getUploadProgress` 的轮询（永远是 null）
  - 改为 `chrome.runtime.onMessage` 监听 `cs→popup upload-progress`
  - 保持对外 API 不变（uploadProgress / isUploading / uploadError / confirmUpload / cancelUpload）
- [x] 5.2 改造 `ui/SuccessView.tsx` / `RecordingUI.tsx`：
  - SuccessView 的"查看回放"按钮跳转 `${neoUrl}/workspace/${wsCode}/recordings/${recordingUid}/play`
  - 替换当前的 `props.onUploadSuccess?.("")` TODO
- [x] 5.3 实现 `ui/PendingView.tsx` 的自动恢复：
  - 浏览器重启后 popup 打开时检测 IndexedDB 是否有 unsynced segments
  - 如果有，显示 Pending 视图
  - 当前 Popup 启动逻辑已包含此检查（spike 验证过），确认无遗漏

## 6. 后端数据迁移

- [x] 6.1 添加 Alembic migration：扫描所有 workspace，给 owner 自动加 member 记录（如果缺失）
- [x] 6.2 在 startup 时执行一次性数据修复（owner 自动成为 member）
- [x] 6.3 验证 user 3 (admin) 能访问 workspace "default" 的 recordings

## 7. 端到端测试

- [x] 7.1 spike 测试转正式：去掉 `spike-set-auth` / `__spike_start_upload` / `__spike_upload_logs` 等钩子，改用 popup UI 或 SW 服务
- [x] 7.2 e2e 测试：单 tab 单 segment 上传成功（验证 recording 落库）
- [x] 7.3 e2e 测试：多 segments 上传（验证 sequence 递增）
- [x] 7.4 e2e 测试：跨 tab 多 origin 上传（验证每个 tab 独立上传一次）

## 8. 文档

- [x] 8.1 更新 `openspec/specs/rrweb-recording/spec.md`：新增上传场景
- [x] 8.2 更新 `openspec/specs/message-communication/spec.md`：新增 upload-cmd 和 upload-progress 消息类型
- [x] 8.3 更新 `openspec/specs/recording-upload/spec.md`：标注已被 agent-steer 使用
- [x] 8.4 更新 `design/docs/product/agent-steer/recording.md`：补充上传流程图