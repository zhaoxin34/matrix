/**
 * role 推断测试
 *
 * 覆盖:
 *   - 显式 role 属性优先
 *   - tagName → ARIA role 映射
 *   - input type 区分
 *   - 没有 href 的 a / 没有 alt 的 img 返回 null
 *   - 交互 vs 语义 role 分类
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getRole, isInteractiveRole, isSemanticRole } from '../src/role.js';
import { el, clearBody } from './helpers/dom.js';

beforeEach(() => {
  clearBody();
});

describe('getRole - 显式 role 属性', () => {
  it('role 属性优先于 tagName', () => {
    const e = el('<div role="button">点我</div>');
    expect(getRole(e)).toBe('button');
  });

  it('role 保留原始大小写折叠为小写', () => {
    const e = el('<div role="Navigation"></div>');
    expect(getRole(e)).toBe('navigation');
  });
});

describe('getRole - tagName 映射', () => {
  it('<button> → button', () => {
    expect(getRole(el('<button>登录</button>'))).toBe('button');
  });

  it('<a href> → link', () => {
    expect(getRole(el('<a href="/x">x</a>'))).toBe('link');
  });

  it('<a> 无 href → null', () => {
    expect(getRole(el('<a>x</a>'))).toBeNull();
  });

  it('heading 系列', () => {
    expect(getRole(el('<h1>title</h1>'))).toBe('heading');
    expect(getRole(el('<h2>x</h2>'))).toBe('heading');
    expect(getRole(el('<h6>x</h6>'))).toBe('heading');
  });

  it('<img alt> → img', () => {
    expect(getRole(el('<img alt="logo" />'))).toBe('img');
  });

  it('<img> 无 alt → null (presentation)', () => {
    expect(getRole(el('<img />'))).toBeNull();
  });

  it('<nav> → navigation', () => {
    expect(getRole(el('<nav></nav>'))).toBe('navigation');
  });

  it('<main> → main', () => {
    expect(getRole(el('<main></main>'))).toBe('main');
  });
});

describe('getRole - input type 区分', () => {
  const cases: Array<[string, string]> = [
    ['text', 'textbox'],
    ['email', 'textbox'],
    ['search', 'search'],
    ['number', 'spinbutton'],
    ['checkbox', 'checkbox'],
    ['radio', 'radio'],
    ['range', 'slider'],
    ['submit', 'button'],
    ['reset', 'button'],
    ['button', 'button'],
  ];

  for (const [type, role] of cases) {
    it(`input[type=${type}] → ${role}`, () => {
      expect(getRole(el(`<input type="${type}" />`))).toBe(role);
    });
  }

  it('input 缺省 type=text', () => {
    expect(getRole(el('<input />'))).toBe('textbox');
  });
});

describe('getRole - select', () => {
  it('单选 select → combobox', () => {
    expect(getRole(el('<select><option>x</option></select>'))).toBe('combobox');
  });

  it('多选 select → listbox', () => {
    const e = el('<select multiple><option>x</option></select>');
    expect(getRole(e)).toBe('listbox');
  });
});

describe('isInteractiveRole / isSemanticRole', () => {
  it('button 是 interactive', () => {
    expect(isInteractiveRole('button')).toBe(true);
  });

  it('heading 不是 interactive 但属于 semantic', () => {
    expect(isInteractiveRole('heading')).toBe(false);
    expect(isSemanticRole('heading')).toBe(true);
  });

  it('div 不是 interactive 也不是 semantic', () => {
    expect(isInteractiveRole('div')).toBe(false);
    expect(isSemanticRole('div')).toBe(false);
  });

  it('null 不是任何分类', () => {
    expect(isInteractiveRole(null)).toBe(false);
    expect(isSemanticRole(null)).toBe(false);
  });
});
