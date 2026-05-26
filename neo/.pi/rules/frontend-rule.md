# 前端规范

- 尽量给页面的可操作元素增加`data-testid`属性, 以便于e2e的测试

示例:
```html
<input type="input" data-testid="inp-username" placeholder="input user name"/>
<button type="button" data-testid="btn-login"> 登录 </button>
```
