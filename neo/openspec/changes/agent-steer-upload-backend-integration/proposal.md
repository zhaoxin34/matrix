# Proposal: agent-steer 录制上传到 Neo 后端

## Why

agent-steer Chrome 扩展的 Popup UI 已完成（43 个任务全部 complete），录制流程（rrweb + IndexedDB + chrome.storage 状态同步）已可工作，但**录制数据只存在本地 IndexedDB，没有真正上传到 Neo 后端**。当前 `uploader.ts` / `communicator.ts.startUpload()` 只有一个空壳，UI 的 `UploadPanel` 显示的进度永远是 0。

后端 recording API（CRUD + segments + presigned + bytes proxy + complete）已完整实现并测试覆盖，本次工作是把扩展端的上传链路接通。

## What Changes

- agent-steer 扩展的 **Content Script (ISOLATED world)** 主导上传：读 IndexedDB segments，调 fetch 走 Neo 后端 API
- Service Worker 把 Popup 的 upload 命令**转发**到当前 tab 的 CS
- Content Script 把**上传进度**通过 chrome.runtime.sendMessage 推给 Popup
- Popup 的 `useUploadState` 改为**监听 upload-progress 消息**（去掉现在永远拿不到进度的 SW 轮询）
- Popup 的 `SuccessView` 在上传成功后**跳转**到 Neo Frontend 的录像回放页
- **跨 tab 多 origin 处理**：每个 tab 独立上传（每次只能上传当前激活 tab 的 segments）
- **后端 CORS 放宽**为 `allow_origins=["*"]` + `allow_credentials=True`（agent-steer 跨 origin 调 fetch；前端靠 cookie 鉴权必须 allow_credentials=True；Starlette 自动 echo 实际 origin 绕开浏览器限制）

## Capabilities

### Modified Capabilities

- `rrweb-recording`: 新增上传流程相关场景（用户触发上传、CS 读 IndexedDB、调后端 API、上传进度推送、成功跳转回放）
- `message-communication`: 新增 `upload-cmd` 命令从 Popup 经 SW 到 CS，新增 `cs→popup upload-progress` 消息类型
- `recording-upload`: 无 API 改动，但 spec 文档需要标注"已被 agent-steer 上传链路使用"

### New Capabilities

无（沿用现有 capability，避免过度拆分）

## Impact

**agent-steer 扩展**:
- 新增 `cs/state.ts.pushUploadProgress()` helper
- 新增 `cs/commands.ts.handleUpload()` 核心上传逻辑（POST recording → 循环 PUT bytes + POST segments → POST complete）
- 改造 `sw/communicator.ts.startUpload()` 为转发 upload-cmd 到 CS
- 改造 `ui/hooks/useUploadState.ts` 监听 `cs→popup upload-progress` 消息
- 补 `ui/SuccessView.tsx` 跳转 URL（`${neoUrl}/workspace/${wsCode}/recordings/${uid}/play`）
- 清理 spike 期间的临时钩子（`__spike_start_upload`、`__spike_upload_logs`、`spike-start-upload` handler）

**后端**:
- `backend/src/app/main.py`: CORS 改为 `allow_origins=["*"]` + `allow_credentials=False`
- 无 API schema 改动

**测试**:
- spike 期间的 `e2e/spike-upload.spec.ts` 转正式 e2e 测试（去掉 spike 钩子）
- 新增多 tab 多 origin 上传测试

**用户流程**:
- 单 tab：用户在 tab A 录制 → 暂停 → 点上传 → 输入名称 → CS 读 IndexedDB → 调后端 API → 进度推送 → 成功后跳转回放
- 多 tab：用户在多个 tab 录制 → 在每个 tab 单独点上传（每次上传当前 tab 的 segments）。MVP 不做"批量上传所有 tab"