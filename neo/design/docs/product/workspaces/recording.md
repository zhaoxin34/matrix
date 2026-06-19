---
id: recording
title: Recording 录像管理 产品设计
sidebar_position: 25
author: Joky.Zhao
created: 2026-06-10
updated: 2026-06-10
version: 0.1.0
tags: [Recording, Workspace]
---

## 🎯 产品概述

### 什么是 Recording

**Recording**（录像）是 Workspace 下的资源，用于存储用户在浏览器中的操作录制数据。

### 为什么需要 Recording

在 Agent Steer 中，用户可以录制自己的操作行为。这些录制数据需要：
1. **持久化存储**：保存到 S3 兼容存储
2. **统一管理**：在 Workspace 下进行增删改查
3. **回放查看**：支持 rrweb 回放
4. **分类检索**：支持标签、搜索、筛选

---

## 📖 核心概念

### 层级结构

```
Workspace
└── Recording（录像）
    └── Segment（录像段）
```

**关键理解**：
- 一个 Recording 包含多个 Segment
- 每个 Segment 是一个独立的 rrweb 文件（每10分钟生成一段）
- 每个 Segment 可能包含多个 PageUrl（录制过程中跳转了不同页面）

### Segment（录像段）

> **定义**：单个 rrweb 录制文件，对应一个时间段的录制数据。

**字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| recordingId | string | 所属 Recording 的 ID |
| startTime | datetime | 段开始时间 |
| endTime | datetime | 段结束时间 |
| pageUrls | string[] | 该段涉及的页面 URL 列表 |
| storageKey | string | S3 存储路径 |
| size | number | 文件大小（字节） |

> 注意：pageUrls 会展示给用户，用于预览该段录制涉及了哪些页面。

### Recording（录像）

> **定义**：用户可见的完整录像，由多个 Segment 组成。

**字段**：
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| workspaceId | string | 所属 Workspace |
| name | string | 录像名称（用户可编辑），默认自动生成 |
| tags | string[] | 标签列表 |
| status | enum | 状态：recording/completed/failed |
| enterUrl | string | 进入 URL（开始录制时的页面） |
| exitUrl | string | 退出 URL（结束录制时的页面） |
| totalDuration | number | 总时长（秒） |
| totalSize | number | 总大小（字节） |
| createdAt | datetime | 创建时间 |
| updatedAt | datetime | 更新时间 |


---

## 🔧 功能列表

### 1. 列表展示

- 显示当前 Workspace 下的所有 Recording
- 每条记录显示：名称、时长、创建时间、标签
- 支持排序（按时间、按名称、按大小）

### 2. 搜索筛选

- **全文搜索**：按名称搜索
- **标签筛选**：按标签过滤
- **时间范围**：按创建时间筛选

### 3. 批量操作

- 批量选择（勾选）
- 批量删除
- 批量添加标签
- 批量移除标签

### 4. 单条操作

- **重命名**：编辑录像名称
- **标签管理**：添加/移除标签
- **删除**：删除录像（包括所有 Segment）
- **详情查看**：查看录像详情和段列表

### 5. 回放

- 使用 rrweb Player 播放
- 支持播放/暂停/进度拖拽
- 显示 Segment 列表，用户可以选择从哪个段开始播放

### 6. 删除确认

- 删除录像时需要二次确认
- 提示内容："确定删除此录像吗？此操作不可撤销。"

### 7. 标注

用户在回放时，如果察觉当前画面上值得告知别人的点，比如用户画像时，为什么选择某个人群，则可以利用标注功能告知他人，这样当别人回放这个录像时就能看到用户的标注。

标注针对的的录像的片段(segment)的某个时段进行标注，也就是说，当录像播放到这个时段的起点时，展示标注，当播放到标注时段的结束时，隐藏标注。

回放录像segment时，某一时段，可能出现多个标注。

#### 7.1. 标注实体

**实体名称**: `recording-segment-comment`

**实体字段**:

- id: 自增id
- recording_id: 录像id
- segment_id: 录像片段的id
- show_time: 展示的时间
- hide_time: 隐藏的时间
- abstract: 摘要
- content：标注内容
- creator_id: 创建人id
- create_at
- update_at

---

## ✅ 设计检查清单

- [x] 定义清晰的产品边界
- [x] 定义名词解释
- [x] 定义功能范围
- [x] 设计 UI 界面
- [x] UI 比较简单，暂不需要原型
- [x] 定义权限矩阵（由 Workspace 级别控制，无需单独定义）

### 权限说明

Recording 属于 Workspace 级别资源，权限继承自 Workspace：
- **Viewer**：可以查看录像列表、详情、回放
- **Editor**：可以重命名、添加标签、删除录像
- **Owner**：全部权限