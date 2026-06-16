---
id: agent-steer-recording
title: 软件操作录像管理
sidebar_position: 1
author: Joky.Zhao
created: 2026-06-12
updated: 2026-06-15
version: 0.2.0
tags: [Agent Steer, 录像]
---

## 名词解释

- 目标软件：也就是chrome 扩展被嵌入的网站

## 🎯 功能概述

- **前置条件**：用户必须先在 Neo Frontend 登录并选择了工作区。Agent Steer 通过嵌入 frontend 的隐藏 iframe 复用登录态获取 token 和 workspace 信息。未登录或未选 workspace 时，Popup 会提示用户去登录。
- 跨tab录制录像: 录制不限于单个tab，可以跨tab录制， 但是每一时刻只有一个在录像，录制的是active的tab
- 自动停止录像: 当浏览器不活跃一段时间后，自动停止录像
- 自动创建录像meatadata：一旦用户开始录像，则自动创建后端recording, 并记录到浏览器的local.storage, 即使浏览器重启也能续传
- 自动上传：录像结束后，自动追加segment到recording
- 自动分段：录像每隔10分钟，自动分段，自然，分段后上一段自动上传
- 查看回放：跳转回neo的frontend页面
- 标注： TODO 暂时不做
