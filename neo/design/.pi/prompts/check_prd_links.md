---
description: 检查产品文档的链接是否正常，不正常则修正
argument-hint: <doc_path>
---

按照如下步骤检查文档 $1 的链接是否正确

假设当前文件是 `$PROJECT_DIR/docs/product/path_a/file1.md`
假设链接目标的文件是 `$PROJECT_DIR/docs/product/path_b/file2.md`

为了正确链接，首先要读取目标文件，本例中需读取file2.md 示例如下

```
---
id: file2
title: file2 title
---
```

正确的链接如下

`[file2 title](../path_2/file2)` 即 `[${file2.title}](../${file2.path}/${file2.id})`

或者绝对地址

`[file2 title](/products/path_2/file2)`

如果链接错误，请修复
