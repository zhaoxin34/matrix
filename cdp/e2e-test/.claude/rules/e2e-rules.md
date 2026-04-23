# playwright 测试编写规范

- 尽量使用`data-testid`属性进行交互操作

糟糕的示例:
```python
get_by_role("button", name="新 增")
get_by_text("客户管理")
```

良好的示例:
```python
get_by_test_id("btn-new")
get_by_test_id("inp-cust-manage")
```
