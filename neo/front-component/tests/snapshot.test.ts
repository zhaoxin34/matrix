/**
 * snapshot 核心测试
 *
 * 覆盖:
 *   - 基础扫描: 用户示例里的 DOM 树
 *   - id 分配: 严格 e1/e2/... 顺序
 *   - 过滤: aria-hidden / disabled / 零尺寸 / 装饰元素
 *   - options: visibleOnly / interactiveOnly / include / exclude
 *   - 元素 value / states / href 字段
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { snapshot, getElementById, resetElementMap } from '../src/snapshot.js';
import { el, clearBody } from './helpers/dom.js';

beforeEach(() => {
  clearBody();
  resetElementMap();
});

describe('snapshot - 用户场景', () => {
  it('用户示例: header + main 简单结构', () => {
    clearBody();
    // 用户问题里给的原始示例
    const root = el(`
      <div>
        <header>
          <button>登录</button>
          <button>注册</button>
        </header>
        <main>
          <input placeholder="搜索商品" />
          <button>搜索</button>
        </main>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    const ZERO_RECT = { x: 0, y: 0, width: 0, height: 0 };
    expect(nodes).toEqual([
      {
        id: 'e1',
        role: 'button',
        name: '登录',
        visible: true,
        rect: ZERO_RECT,
        depth: 2,
        text: '登录',
      },
      {
        id: 'e2',
        role: 'button',
        name: '注册',
        visible: true,
        rect: ZERO_RECT,
        depth: 2,
        text: '注册',
      },
      {
        id: 'e3',
        role: 'textbox',
        name: '搜索商品',
        visible: true,
        rect: ZERO_RECT,
        depth: 2,
        value: '',
        placeholder: '搜索商品',
      },
      {
        id: 'e4',
        role: 'button',
        name: '搜索',
        visible: true,
        rect: ZERO_RECT,
        depth: 2,
        text: '搜索',
      },
    ]);
  });
});

describe('snapshot - id 分配', () => {
  it('严格按深度优先 e1/e2/...', () => {
    clearBody();
    const root = el(`
      <div>
        <button>1</button>
        <button>2</button>
        <div>
          <button>3</button>
          <button>4</button>
        </div>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes.map((n) => n.name)).toEqual(['1', '2', '3', '4']);
    expect(nodes.map((n) => n.id)).toEqual(['e1', 'e2', 'e3', 'e4']);
  });

  it('snapshot 后能用 id 拿回 Element', () => {
    clearBody();
    const root = el('<div><button id="b1">x</button></div>');
    document.body.appendChild(root);

    const nodes = snapshot(root);
    const back = getElementById(nodes[0].id);
    expect(back?.tagName.toLowerCase()).toBe('button');
  });
});

describe('snapshot - 过滤', () => {
  it('跳过 aria-hidden', () => {
    clearBody();
    const root = el(`
      <div>
        <button>可见</button>
        <button aria-hidden="true">隐藏</button>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes.map((n) => n.name)).toEqual(['可见']);
  });

  it('不过滤 disabled,改为通过 disabled 字段标注', () => {
    clearBody();
    const root = el(`
      <div>
        <button>启用</button>
        <button disabled>禁用</button>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes.map((n) => n.name)).toEqual(['启用', '禁用']);
    // 启用的按钮不带 disabled 字段
    expect(nodes[0].disabled).toBeUndefined();
    // 禁用的按钮带 disabled: true
    expect(nodes[1].disabled).toBe(true);
  });

  it('跳过 <script> <style>', () => {
    clearBody();
    const root = el(`
      <div>
        <button>真实</button>
        <script>alert(1)</script>
        <style>body{}</style>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes.length).toBe(1);
    expect(nodes[0].name).toBe('真实');
  });

  it('interactiveOnly=false 时 heading 也被纳入', () => {
    clearBody();
    const root = el(`
      <div>
        <h1>标题</h1>
        <button>btn</button>
      </div>
    `);
    document.body.appendChild(root);

    const onlyInter = snapshot(root, { interactiveOnly: true });
    expect(onlyInter.map((n) => n.role)).toEqual(['button']);

    const allSem = snapshot(root, { interactiveOnly: false });
    expect(allSem.map((n) => n.role)).toEqual(['heading', 'button']);
  });

  it('include 强制纳入指定 selector', () => {
    clearBody();
    const root = el(`
      <div>
        <span class="tag" data-testid="t1">tag1</span>
        <span class="tag" data-testid="t2">tag2</span>
        <button>btn</button>
      </div>
    `);
    document.body.appendChild(root);

    // 不加 include: span 被过滤,只剩 button
    const def = snapshot(root);
    expect(def.map((n) => n.name)).toEqual(['btn']);

    // 加 include: span 被强制纳入,通过 data-testid 拿到 name
    const inc = snapshot(root, { include: ['.tag'] });
    expect(inc.map((n) => n.name)).toEqual(['t1', 't2', 'btn']);
  });
});

describe('snapshot - include 选项修订', () => {
  it('include 让本应被过滤的元素也参与', () => {
    clearBody();
    const root = el(`
      <div>
        <span data-testid="sp1">tag1</span>
        <span data-testid="sp2">tag2</span>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root, { include: ['[data-testid^="sp"]'] });
    // span 被强制纳入 + data-testid 提供 name
    expect(nodes.map((n) => n.name)).toEqual(['sp1', 'sp2']);
  });
});

describe('snapshot - 元素详情', () => {
  it('checkbox 记录 checked 字段', () => {
    clearBody();
    const root = el(`
      <div>
        <input type="checkbox" data-testid="c1" />
        <input type="checkbox" checked data-testid="c2" />
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    // 未勾选的不带 checked 字段
    expect(nodes[0].checked).toBeUndefined();
    // 勾选的带 checked: true
    expect(nodes[1].checked).toBe(true);
  });

  it('a 元素记录 href', () => {
    clearBody();
    const root = el('<div><a href="/home" data-testid="l1">home</a></div>');
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes[0].href).toBe('/home');
  });

  it('heading 记录 level', () => {
    clearBody();
    const root = el(`
      <div>
        <h1 data-testid="h1">h1</h1>
        <h3 data-testid="h3">h3</h3>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root, { include: ['h1', 'h3'] });
    expect(nodes[0].level).toBe(1);
    expect(nodes[1].level).toBe(3);
  });

  it('input 记录 value', () => {
    clearBody();
    const root = el('<div><input type="text" data-testid="t1" value="hello" /></div>');
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes[0].value).toBe('hello');
  });
});

describe('snapshot - exclude 选项', () => {
  it('exclude 比 include 优先级高', () => {
    clearBody();
    const root = el(`
      <div>
        <button data-testid="b1">btn1</button>
        <button data-testid="b2">btn2</button>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root, {
      include: ['[data-testid="b1"]', '[data-testid="b2"]'],
      exclude: ['[data-testid="b2"]'],
    });
    expect(nodes.map((n) => n.name)).toEqual(['b1']);
  });
});

describe('snapshot - 必填字段 visible/rect', () => {
  it('visible 默认 true', () => {
    clearBody();
    const root = el('<div><button data-testid="b1">x</button></div>');
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes[0].visible).toBe(true);
  });

  it('rect 总是输出,包含 x/y/width/height', () => {
    clearBody();
    const root = el('<div><button data-testid="b1">x</button></div>');
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes[0].rect).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    expect(Object.keys(nodes[0].rect).sort()).toEqual(['height', 'width', 'x', 'y']);
  });

  it('aria-hidden 元素 visible=false', () => {
    clearBody();
    const root = el(`
      <div>
        <button data-testid="b1">可见</button>
        <button aria-hidden="true" data-testid="b2">隐藏</button>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root);
    expect(nodes[0].visible).toBe(true);
    expect(nodes).toHaveLength(1); // 隐藏的被过滤
  });

  it('visibleOnly=false 时,隐藏元素也被纳入,visible=false', () => {
    clearBody();
    const root = el(`
      <div>
        <button data-testid="b1">可见</button>
        <button aria-hidden="true" data-testid="b2">隐藏</button>
      </div>
    `);
    document.body.appendChild(root);

    const nodes = snapshot(root, { visibleOnly: false });
    expect(nodes).toHaveLength(2);
    expect(nodes[0].visible).toBe(true);
    expect(nodes[1].visible).toBe(false);
  });
});

describe('snapshot - 可选字段 checked', () => {
  it('未勾选 checkbox 不带 checked 字段', () => {
    clearBody();
    const root = el('<div><input type="checkbox" data-testid="c1" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].checked).toBeUndefined();
  });

  it('已勾选 checkbox 带 checked: true', () => {
    clearBody();
    const root = el('<div><input type="checkbox" checked data-testid="c1" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].checked).toBe(true);
  });

  it('radio 同样适用', () => {
    clearBody();
    const root = el(`
      <div>
        <input type="radio" data-testid="r1" value="a" />
        <input type="radio" checked data-testid="r2" value="b" />
      </div>
    `);
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].checked).toBeUndefined();
    expect(nodes[1].checked).toBe(true);
  });

  it('button 不带 checked 字段(只对 checkbox/radio/switch)', () => {
    clearBody();
    const root = el('<div><button data-testid="b1">x</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].checked).toBeUndefined();
  });
});

describe('snapshot - 可选字段 disabled', () => {
  it('未禁用元素不带 disabled 字段', () => {
    clearBody();
    const root = el('<div><button data-testid="b1">x</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].disabled).toBeUndefined();
  });

  it('disabled 属性带 disabled: true', () => {
    clearBody();
    const root = el('<div><button disabled data-testid="b1">x</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].disabled).toBe(true);
  });

  it('aria-disabled="true" 同样带 disabled: true', () => {
    clearBody();
    const root = el('<div><button aria-disabled="true" data-testid="b1">x</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].disabled).toBe(true);
  });

  it('aria-disabled="false" 不带 disabled 字段', () => {
    clearBody();
    const root = el('<div><button aria-disabled="false" data-testid="b1">x</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].disabled).toBeUndefined();
  });

  it('disabled input 也带 disabled: true', () => {
    clearBody();
    const root = el('<div><input disabled data-testid="i1" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].disabled).toBe(true);
  });
});

describe('snapshot - 可选字段 placeholder', () => {
  it('input 带 placeholder 时输出', () => {
    clearBody();
    const root = el('<div><input placeholder="请输入手机号" data-testid="i1" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].placeholder).toBe('请输入手机号');
  });

  it('input 无 placeholder 不带该字段', () => {
    clearBody();
    const root = el('<div><input data-testid="i1" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].placeholder).toBeUndefined();
  });

  it('textarea 也支持 placeholder', () => {
    clearBody();
    const root = el('<div><textarea placeholder="多行描述" data-testid="t1"></textarea></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].placeholder).toBe('多行描述');
  });

  it('input[type=submit] 不带 placeholder(role=button)', () => {
    clearBody();
    const root = el('<div><input type="submit" value="提交" data-testid="s1" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].placeholder).toBeUndefined();
  });
});

describe('snapshot - 可选字段 text', () => {
  // --- a 标签场景 ---
  it('有 data-testid 的 a 标签:name 和 text 分开', () => {
    clearBody();
    const root = el('<div><a href="/home" data-testid="nav-home">首页</a></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].name).toBe('nav-home');
    expect(nodes[0].text).toBe('首页');
  });

  it('无 data-testid 的 a 标签:name === text', () => {
    clearBody();
    const root = el('<div><a href="/home">首页</a></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].name).toBe('首页');
    expect(nodes[0].text).toBe('首页');
  });

  it('text 折叠多空白', () => {
    clearBody();
    const root = el('<div><a href="/x" data-testid="a1">首页   next  </a></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].text).toBe('首页 next');
  });

  // --- button 场景 ---
  it('有 data-testid 的 button:name 和 text 分开', () => {
    clearBody();
    const root = el('<div><button data-testid="btn-submit">提交订单</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].name).toBe('btn-submit');
    expect(nodes[0].text).toBe('提交订单');
  });

  it('无 data-testid 的 button:name === text', () => {
    clearBody();
    const root = el('<div><button>提交订单</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].name).toBe('提交订单');
    expect(nodes[0].text).toBe('提交订单');
  });

  it('带 icon + 文字的 button:text 保留文字部分', () => {
    clearBody();
    const root = el('<div><button data-testid="btn-edit"><svg></svg>编辑</button></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    // textContent 包含 svg 文字节点(空) + "编辑"
    expect(nodes[0].text).toBe('编辑');
  });

  // --- option / tab ---
  it('option 元素也带 text', () => {
    clearBody();
    const root = el(`
      <select>
        <option value="a" data-testid="opt-a">苹果</option>
        <option value="b" data-testid="opt-b" selected>香蕉</option>
      </select>
    `);
    document.body.appendChild(root);
    const nodes = snapshot(root, { interactiveOnly: false });
    // option 是 role=option,允许出现在 interactiveOnly=false 下
    // 默认 interactiveOnly=true 会过滤掉
    const opts = nodes.filter((n) => n.role === 'option');
    expect(opts).toHaveLength(2);
    expect(opts[0].text).toBe('苹果');
    expect(opts[1].text).toBe('香蕉');
  });

  // --- 排除规则 ---
  it('input/textarea 不带 text 字段(它们用 placeholder 表达语义)', () => {
    clearBody();
    const root = el('<div><input type="text" placeholder="搜索" /></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes[0].text).toBeUndefined();
  });

  it('heading 不带 text(name 已经是 textContent)', () => {
    clearBody();
    const root = el('<div><h1>标题</h1></div>');
    document.body.appendChild(root);
    const nodes = snapshot(root, { interactiveOnly: false });
    expect(nodes[0].text).toBeUndefined();
  });
});

describe('snapshot - dialog 元素', () => {
  it('dialog 默认识别为 interactive', () => {
    clearBody();
    const root = el(`
      <div>
        <div role="dialog" aria-label="确认">
          <button>取消</button>
          <button>确认</button>
        </div>
      </div>
    `);
    document.body.appendChild(root);
    const nodes = snapshot(root);
    // dialog + 2 buttons 都该被收集
    expect(nodes.map((n) => n.role)).toContain('dialog');
    expect(nodes.filter((n) => n.role === 'button').length).toBe(2);
  });
});

describe('snapshot - 完整字段组合示例', () => {
  it('一个元素可同时带多个新字段', () => {
    clearBody();
    const root = el(`
      <div>
        <input
          type="text"
          data-testid="phone"
          placeholder="请输入手机号"
          value="13800"
          required
        />
        <a
          href="/help"
          data-testid="help-link"
          aria-expanded="false"
        >需要帮助</a>
      </div>
    `);
    document.body.appendChild(root);
    const nodes = snapshot(root);
    expect(nodes).toHaveLength(2);

    // input: visible + rect + value + placeholder + states (required)
    expect(nodes[0]).toMatchObject({
      role: 'textbox',
      name: 'phone',
      visible: true,
      value: '13800',
      placeholder: '请输入手机号',
      states: ['required'],
    });
    expect(nodes[0].rect).toEqual({ x: 0, y: 0, width: 0, height: 0 });

    // a: visible + rect + href + text + states (collapsed)
    expect(nodes[1]).toMatchObject({
      role: 'link',
      name: 'help-link',
      visible: true,
      href: '/help',
      text: '需要帮助',
      states: ['collapsed'],
    });
  });
});
