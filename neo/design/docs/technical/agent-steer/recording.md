---
id: recording
title: 录像上传技术设计
sidebar_position: 10
author: Joky.Zhao
created: 2026-06-13
updated: 2026-06-13
version: 1.0.0
tags: [Agent, Steer, Recording, Chrome Extension]
---

## 1. 录像上传时序图

本文档描述 Chrome 扩展录像上传功能的详细时序设计。

### 1.1 开始录制

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant CS as Content Script
    participant DB as IndexedDB

    User->>Popup: 点击"开启录制"
    Popup->>CS: 发送 START_RECORDING 命令
    CS->>CS: 启动 rrweb 录制
    CS->>DB: 存储录制数据（内存/分段）
    CS-->>Popup: 返回录制状态
    Popup->>Popup: 显示录制中状态
```

### 1.2 暂停录制

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant CS as Content Script
    participant DB as IndexedDB

    User->>Popup: 点击"暂停"
    Popup->>CS: 发送 PAUSE_RECORDING 命令
    CS->>CS: 暂停 rrweb 录制
    CS->>DB: 保存当前片段
    CS-->>Popup: 返回暂停状态 + 片段信息
    Popup->>Popup: 显示已暂停 + 上传按钮
```

### 1.3 上传录像

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant CS as Content Script
    participant API as Neo Backend

    User->>Popup: 点击"上传"
    Popup->>Popup: 弹出输入框
    User->>Popup: 输入录像名称
    User->>Popup: 点击"确认上传"
    Popup->>CS: 请求录制数据
    CS-->>Popup: 返回录制数据
    Popup->>API: POST /api/v1/workspaces/{code}/recordings
    API-->>Popup: 返回 recordingUid
    Popup->>API: POST /api/v1/recordings/{uid}/segments
    API-->>Popup: 返回 segmentUid
    Popup->>API: POST /api/v1/recordings/{uid}/segments/presigned
    API-->>Popup: 返回 presigned 上传 URL
    Popup->>API: 上传文件（presigned URL）
    API-->>Popup: 上传成功
    Popup->>API: PATCH /api/v1/recordings/{uid} status=completed
    alt 成功
        Popup->>Popup: 显示上传成功
    else 失败
        Popup->>Popup: 显示错误信息
    end
```

### 1.4 继续录制

```mermaid
sequenceDiagram
    participant User
    participant Popup
    participant CS as Content Script
    participant DB as IndexedDB

    User->>Popup: 点击"继续录制"
    Popup->>CS: 发送 RESUME_RECORDING 命令
    CS->>CS: 继续 rrweb 录制（续接上一片段）
    CS-->>Popup: 返回录制中状态
    Popup->>Popup: 显示录制中状态
```

### 1.5 消息示例

#### 开始录制

```typescript
// Popup → CS
{
  type: 'recording.start',
  version: 1,
  direction: 'command',
  timestamp: 1717852800000,
  messageId: 'cmd_001'
}

// CS → Popup
{
  type: 'recording.state',
  version: 1,
  direction: 'event',
  timestamp: 1717852800100,
  messageId: 'evt_001',
  payload: {
    isRecording: true,
    isPaused: false,
    duration: 0,
    segmentCount: 1,
    eventCount: 0
  }
}
```

#### 请求录制数据（上传前）

```typescript
// Popup → CS
{
  type: 'recording.fetch',
  version: 1,
  direction: 'command',
  timestamp: 1717852800000,
  messageId: 'cmd_005'
}

// CS → Popup
{
  type: 'recording.data',
  version: 1,
  direction: 'event',
  timestamp: 1717852800100,
  messageId: 'evt_005',
  payload: {
    segments: [
      { uid: 'seg_001', duration: 600000, eventCount: 128 },
      { uid: 'seg_002', duration: 600000, eventCount: 96 }
    ]
  }
}
```

---

## 🔗 相关文档

- [Agent Steer 技术设计](./index) - 系统架构和消息协议
- [软件操作录像与回放](../../product/agent-steer/recording) - 功能详细设计（产品设计）