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
import {
  getRole,
  isInteractiveRole,
  isContentRole,
  isStructuralRole,
  isSemanticRole,
} from '../src/role.js';
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
    ['search', 'searchbox'],
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

  it('dialog 默认是 interactive(打开时 LLM 需知道是 modal)', () => {
    expect(isInteractiveRole('dialog')).toBe(true);
    expect(isSemanticRole('dialog')).toBe(true);
  });
});

describe('getRole - v0.2 补全角色', () => {
  it('<label> → label (以前是 null)', () => {
    expect(getRole(el('<label>用户名</label>'))).toBe('label');
  });

  it('<legend> → label (它是 fieldset 的标签)', () => {
    expect(getRole(el('<legend>性别</legend>'))).toBe('label');
  });

  it('<fieldset> 含 radio → radiogroup', () => {
    expect(
      getRole(
        el(`<fieldset>
          <legend>性别</legend>
          <input type="radio" name="g" value="m" />
          <input type="radio" name="g" value="f" />
        </fieldset>`),
      ),
    ).toBe('radiogroup');
  });

  it('<fieldset> 无 radio → group', () => {
    expect(
      getRole(
        el(`<fieldset>
          <legend>不相关项</legend>
          <input type="checkbox" />
        </fieldset>`),
      ),
    ).toBe('group');
  });

  it('<search> → search (HTML5 landmark)', () => {
    expect(getRole(el('<search><input /></search>'))).toBe('search');
  });

  it('显式 role="menuitemcheckbox" 优先', () => {
    expect(getRole(el('<div role="menuitemcheckbox">切换</div>'))).toBe('menuitemcheckbox');
  });

  it('显式 role="menuitemradio" 优先', () => {
    expect(getRole(el('<div role="menuitemradio">选项</div>'))).toBe('menuitemradio');
  });

  it('显式 role="treeitem" 优先', () => {
    expect(getRole(el('<div role="treeitem">文件</div>'))).toBe('treeitem');
  });

  it('显式 role="gridcell" 优先于 cell', () => {
    expect(getRole(el('<div role="gridcell">数据</div>'))).toBe('gridcell');
  });

  it('<th scope=col> → columnheader', () => {
    expect(getRole(el('<th scope="col">表头</th>'))).toBe('columnheader');
  });

  it('<th scope=row> → rowheader', () => {
    expect(getRole(el('<th scope="row">表头</th>'))).toBe('rowheader');
  });
});

describe('3 层 role 分类 helper', () => {
  describe('isInteractiveRole', () => {
    it.each(['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'tab'])(
      '%s 是 interactive',
      (role) => {
        expect(isInteractiveRole(role)).toBe(true);
      },
    );
  });

  describe('isContentRole', () => {
    it.each(['heading', 'label', 'img', 'cell', 'gridcell', 'listitem', 'navigation'])(
      '%s 是 content',
      (role) => {
        expect(isContentRole(role)).toBe(true);
      },
    );
    it('heading 是 content,不是 interactive', () => {
      expect(isInteractiveRole('heading')).toBe(false);
      expect(isContentRole('heading')).toBe(true);
    });
  });

  describe('isStructuralRole', () => {
    it.each(['list', 'group', 'radiogroup', 'table', 'row', 'menu', 'tablist', 'tree', 'grid'])(
      '%s 是 structural',
      (role) => {
        expect(isStructuralRole(role)).toBe(true);
      },
    );
    it('button 不是 structural', () => {
      expect(isStructuralRole('button')).toBe(false);
    });
    it('heading 不是 structural', () => {
      expect(isStructuralRole('heading')).toBe(false);
    });
  });

  describe('isSemanticRole (向后兼容别名)', () => {
    it('= INTERACTIVE ∪ CONTENT', () => {
      expect(isSemanticRole('button')).toBe(true); // interactive
      expect(isSemanticRole('heading')).toBe(true); // content
      expect(isSemanticRole('list')).toBe(false); // structural, 不算
      expect(isSemanticRole('radiogroup')).toBe(false);
    });
  });
});
