/**
 * click / fill 操作测试
 *
 * 覆盖:
 *   - 正常 click 触发 click 监听器
 *   - click 跳过 disabled
 *   - fill 写入 value + 触发 input/change 事件
 *   - fill 跳过 disabled
 *   - 找不到 id 时返回 ok: false
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { snapshot, click, fill, resetElementMap } from '../src/index.js';
import { el, clearBody } from './helpers/dom.js';

beforeEach(() => {
  clearBody();
  resetElementMap();
});

describe('click', () => {
  it('点击触发 click 事件监听器', () => {
    clearBody();
    const btn = el('<button data-testid="b1">点我</button>');
    document.body.appendChild(btn);

    const handler = vi.fn();
    btn.addEventListener('click', handler);

    const {nodes} = snapshot(document.body);
    expect(nodes.length).toBe(1);

    const r = click('e1', nodes);
    expect(r.ok).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('找不到 id 返回失败', () => {
    clearBody();
    el('<button>x</button>');
    document.body.appendChild(document.body.firstElementChild!);

    const r = click('e99');
    expect(r.ok).toBe(false);
    expect(r.message).toContain('e99');
  });

  it('点击 disabled 按钮失败', () => {
    clearBody();
    const btn = el('<button disabled data-testid="b1">禁用</button>');
    document.body.appendChild(btn);

    const handler = vi.fn();
    btn.addEventListener('click', handler);

    const {nodes} = snapshot(document.body);
    // disabled 元素不再被过滤,在 snapshot 中以 disabled: true 标注
    expect(nodes.length).toBe(1);
    expect(nodes[0].disabled).toBe(true);

    // click 拒绝操作 disabled 元素
    const r = click('e1', nodes);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('禁用');
    expect(handler).not.toHaveBeenCalled();
  });

  it('aria-disabled 视为禁用', () => {
    clearBody();
    const btn = el('<button aria-disabled="true" data-testid="b1">aria 禁</button>');
    document.body.appendChild(btn);

    const {nodes} = snapshot(document.body);
    // aria-disabled 元素被 snapshot 纳入,但标注 disabled: true
    expect(nodes.length).toBe(1);
    expect(nodes[0].disabled).toBe(true);

    // click 拒绝
    const r = click('e1', nodes);
    expect(r.ok).toBe(false);
  });
});

describe('fill', () => {
  it('写入 value + 触发 input/change', () => {
    clearBody();
    const input = el('<input type="text" data-testid="i1" />');
    document.body.appendChild(input);

    const inputHandler = vi.fn();
    const changeHandler = vi.fn();
    input.addEventListener('input', inputHandler);
    input.addEventListener('change', changeHandler);

    const {nodes} = snapshot(document.body);
    const r = fill('e1', 'hello', nodes);

    expect(r.ok).toBe(true);
    expect((input as HTMLInputElement).value).toBe('hello');
    expect(inputHandler).toHaveBeenCalled();
    expect(changeHandler).toHaveBeenCalled();
  });

  it('能 fill textarea', () => {
    clearBody();
    const ta = el('<textarea data-testid="t1"></textarea>');
    document.body.appendChild(ta);

    const {nodes} = snapshot(document.body);
    const r = fill('e1', '多行内容', nodes);
    expect(r.ok).toBe(true);
    expect((ta as HTMLTextAreaElement).value).toBe('多行内容');
  });

  it('fill 非 input/textarea 元素失败', () => {
    clearBody();
    const btn = el('<button data-testid="b1">x</button>');
    document.body.appendChild(btn);

    const {nodes} = snapshot(document.body);
    const r = fill('e1', 'x', nodes);
    expect(r.ok).toBe(false);
    expect(r.message).toContain('input/textarea');
  });

  it('找不到 id 返回失败', () => {
    const r = fill('e99', 'x');
    expect(r.ok).toBe(false);
  });

  it('fill disabled input 失败', () => {
    clearBody();
    const input = el('<input disabled data-testid="i1" />');
    document.body.appendChild(input);

    const {nodes} = snapshot(document.body);
    // disabled 元素被纳入,标注 disabled: true
    expect(nodes.length).toBe(1);
    expect(nodes[0].disabled).toBe(true);

    // fill 拒绝
    const r = fill('e1', 'x', nodes);
    expect(r.ok).toBe(false);
    expect((input as HTMLInputElement).value).toBe('');
  });
});

describe('click + fill 联动', () => {
  it('先 fill 再 click 提交', () => {
    clearBody();
    const form = el(`
      <form>
        <input type="text" data-testid="i-name" />
        <button type="button" data-testid="b-submit">提交</button>
      </form>
    `);
    document.body.appendChild(form);

    const submitHandler = vi.fn();
    form.querySelector('button')!.addEventListener('click', submitHandler);

    const {nodes} = snapshot(document.body);
    expect(nodes.map((n) => n.role)).toEqual(['textbox', 'button']);

    fill('e1', '张三', nodes);
    click('e2', nodes);

    expect((form.querySelector('input') as HTMLInputElement).value).toBe('张三');
    expect(submitHandler).toHaveBeenCalled();
  });
});
