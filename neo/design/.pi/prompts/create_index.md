---
description: 生成文档的索引
argument-hint: <文档的根路径>
---

- 把 $1 路径下所有.md和.mdx的文件的id和title读出来，生成索引

- 索引文件是 $1/index.md

- index.md 示例如下

```

| 文件路径 | 页面url      | 标题         |
| ---- | --------- | ------------ |
| `./overview/file1.md`  |  /docs/product/overview/${file.id}  | ${file1.title} |

```


- file1.md 示例如下, 读取时只需要夺取前几行，比如用headn -n 10 读取

```
---
id: file1
title: file2 title
xxx: xxxx
---
```


- 你可以使用多个 scout subagent并行去工作
- 如果index.md不存在，则生成它
- 删除无效的文件和链接
