---
name: ui-extract-mockdata.md
description: 把 UI 项目中的页面所使用的 mockdata 提取出来，放到一个公共的地方管理
argument-hint: "<file_path>"
---

use subagent: 检查 $1 的文档中是否包含mockdata，如果有，将数据移动到 `./ui/mockdata/` 目录下，实现页面与数据分离。

