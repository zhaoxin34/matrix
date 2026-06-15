/**
 * 动态悬浮注释功能测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { snapshot, resetElementMap } from '../../src/dom-snapshot/snapshot.js';
import {
  comment,
  removeComment,
  getAllComments,
  clearAllComments,
  updateComment,
} from '../../src/dom-snapshot/comment.js';
import { el, clearBody } from './helpers/dom.js';

beforeEach(() => {
  clearBody();
  resetElementMap();
  clearAllComments();
});

describe('comment - 基础功能', () => {
  it('comment() 返回 true 表示成功', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '危险操作');
    expect(result).toBe(true);
  });

  it('comment() 找不到元素时返回 false', () => {
    const result = comment('not-exist', 'test');
    expect(result).toBe(false);
  });

  it('comment() 后 getAllComments() 包含该记录', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '危险操作');
    const all = getAllComments();

    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({
      id: 'e1',
      text: '危险操作',
    });
  });
});

describe('comment - 重复添加', () => {
  it('同一个 id 调用两次 comment()，只保留最新的', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '第一次');
    comment('e1', '第二次');

    const all = getAllComments();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('第二次');
  });
});

describe('removeComment', () => {
  it('removeComment() 移除注释', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '危险操作');
    expect(getAllComments()).toHaveLength(1);

    const result = removeComment('e1');
    expect(result).toBe(true);
    expect(getAllComments()).toHaveLength(0);
  });

  it('removeComment() 不存在的 id 返回 false', () => {
    const result = removeComment('not-exist');
    expect(result).toBe(false);
  });

  it('移除后再添加正常工作', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '第一次');
    removeComment('e1');
    comment('e1', '第二次');

    expect(getAllComments()).toHaveLength(1);
    expect(getAllComments()[0].text).toBe('第二次');
  });
});

describe('getAllComments', () => {
  it('多个元素分别添加注释', () => {
    const root = el(`
      <div>
        <button data-testid="b1">删除</button>
        <button data-testid="b2">编辑</button>
        <button data-testid="b3">保存</button>
      </div>
    `);
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '危险');
    comment('e2', '普通');
    comment('e3', '重要');

    const all = getAllComments();
    expect(all).toHaveLength(3);
    expect(all.map((c) => c.text)).toEqual(['危险', '普通', '重要']);
  });

  it('空列表返回空数组', () => {
    const all = getAllComments();
    expect(all).toEqual([]);
  });
});

describe('clearAllComments', () => {
  it('清除所有注释', () => {
    const root = el(`
      <div>
        <button data-testid="b1">删除</button>
        <button data-testid="b2">编辑</button>
      </div>
    `);
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '注释1');
    comment('e2', '注释2');
    expect(getAllComments()).toHaveLength(2);

    clearAllComments();
    expect(getAllComments()).toHaveLength(0);
  });
});

describe('updateComment', () => {
  it('更新已有注释', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '原文本');
    const result = updateComment('e1', '新文本');

    expect(result).toBe(true);
    expect(getAllComments()[0].text).toBe('新文本');
  });

  it('更新不存在的注释时自动添加', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = updateComment('e1', '新添加的文本');

    expect(result).toBe(true);
    expect(getAllComments()).toHaveLength(1);
    expect(getAllComments()[0].text).toBe('新添加的文本');
  });
});

describe('comment - DOM 元素关联', () => {
  it('getAllComments() 返回的元素是原始 DOM 元素', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    const btn = root.querySelector('button')!;
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '注释');

    const all = getAllComments();
    expect(all[0].element).toBe(btn);
  });
});
