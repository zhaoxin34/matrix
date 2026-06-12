---
id: agent-steer-recording
title: 软件操作录像与回放
sidebar_position: 1
author: Joky.Zhao
created: 2026-06-12
updated: 2026-06-12
version: 0.1.0
tags: [Agent Steer, 录像]
---

## 名词解释

- 目标软件：也就是chrome 扩展被嵌入的网站

## 🎯 功能概述

- 是否开启录制：用户打开目标软件后，插件被加载，可通过popup选择是否开启录制
- 记录：开启录制后，Agent Steer会每10分钟录制一个rrweb录像，存储到内存里
- 上传录像：用户通过Agent Steer界面，点击上传录像，输入录像名称，将录像保存
- 回放：用户通过Agent Steer，查看和搜索录像进行回放，不必离开目标网站，注：最好通过iframe嵌入Neo-frontend实现
- 标注： TODO 暂时不做

