/**
 * accessible name 计算测试
 *
 * 覆盖 W3C 顺序:
 *   1. data-testid
 *   2. aria-labelledby
 *   3. aria-label
 *   4. <label for="..."> 关联
 *   5. textContent
 *   6. title
 *   7. placeholder
 *   8. value (input[button-like])
 *   9. alt (img)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessibleName, normalizeName } from '../src/name.js';
import { el, clearBody } from './helpers/dom.js';

beforeEach(() => {
  clearBody();
});

describe('normalizeName', () => {
  it('折叠多空白为单空格', () => {
    expect(normalizeName('  hello   world  ')).toBe('hello world');
  });

  it('合并换行/制表', () => {
    expect(normalizeName('a\nb\tc')).toBe('a b c');
  });

  it('全空白返回空字符串', () => {
    expect(normalizeName('   \n\t  ')).toBe('');
  });
});

describe('getAccessibleName - 优先级', () => {
  it('data-testid 优先于 aria-label', () => {
    const e = el('<button data-testid="btn-x" aria-label="aria文本">真实文本</button>');
    expect(getAccessibleName(e, 'button', document)).toBe('btn-x');
  });

  it('aria-labelledby 优先于 aria-label', () => {
    clearBody();
    // 用一个 wrapper 把两个元素包起来,el() 拿根 div,再 querySelector 拿子元素
    const root = el(`
      <div>
        <span id="lbl">外部标签</span>
        <button aria-labelledby="lbl" aria-label="aria">btn</button>
      </div>
    `);
    const button = root.querySelector('button')!;
    expect(getAccessibleName(button, 'button', document)).toBe('外部标签');
  });

  it('aria-label 优先于 textContent', () => {
    const e = el('<button aria-label="aria 标签">实际文本</button>');
    expect(getAccessibleName(e, 'button', document)).toBe('aria 标签');
  });

  it('label[for] 关联 input', () => {
    clearBody();
    // label 和 input 都包在 <form> 里,一次 el() 拿到根
    const root = el(`
      <form>
        <label for="u">用户名标签</label>
        <input id="u" />
      </form>
    `);
    const input = root.querySelector('input')!;
    expect(getAccessibleName(input, 'textbox', document)).toBe('用户名标签');
  });

  it('button 用 textContent', () => {
    const e = el('<button>  登录  </button>');
    expect(getAccessibleName(e, 'button', document)).toBe('登录');
  });

  it('input 用 placeholder', () => {
    const e = el('<input placeholder="请输入手机号" />');
    expect(getAccessibleName(e, 'textbox', document)).toBe('请输入手机号');
  });

  it('input[submit] 用 value', () => {
    const e = el('<input type="submit" value="提交订单" />');
    expect(getAccessibleName(e, 'button', document)).toBe('提交订单');
  });

  it('img 用 alt', () => {
    const e = el('<img alt="公司 logo" />');
    expect(getAccessibleName(e, 'img', document)).toBe('公司 logo');
  });

  it('title 作为兜底', () => {
    const e = el('<button title="标题兜底"></button>');
    expect(getAccessibleName(e, 'button', document)).toBe('标题兜底');
  });
});

describe('getAccessibleName - 兜底与空值', () => {
  it('没任何 hint 返回空字符串', () => {
    const e = el('<button></button>');
    expect(getAccessibleName(e, 'button', document)).toBe('');
  });

  it('aria-label=" " 视为空,继续向下找', () => {
    const e = el('<button aria-label=" ">真实文本</button>');
    expect(getAccessibleName(e, 'button', document)).toBe('真实文本');
  });

  it('input 不用 textContent(没有 textContent 概念)', () => {
    const e = el('<input type="text">子内容</input>');
    // input 没有 textContent,应该落到 placeholder 或返回空
    expect(getAccessibleName(e, 'textbox', document)).toBe('');
  });
});
