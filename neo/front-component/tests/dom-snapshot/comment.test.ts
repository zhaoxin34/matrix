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
  CommentPositions,
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

describe('comment - 位置配置', () => {
  it('默认位置是 right_top', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '测试');
    const all = getAllComments();
    expect(all).toHaveLength(1);
  });

  it('可以指定不同位置', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '上方', { position: 'top_center' });
    const all = getAllComments();
    expect(all).toHaveLength(1);
  });

  it('可以设置偏移量', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '带偏移', { x: 20, y: 10 });
    const all = getAllComments();
    expect(all).toHaveLength(1);
  });

  it('CommentPositions 导出所有位置常量', () => {
    expect(CommentPositions.RIGHT_TOP).toBe('right_top');
    expect(CommentPositions.LEFT_BOTTOM).toBe('left_bottom');
    expect(CommentPositions.TOP_CENTER).toBe('top_center');
    expect(CommentPositions.BOTTOM_LEFT).toBe('bottom_left');
  });
});

describe('comment - 样式配置', () => {
  it('可以自定义背景色', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '测试', { bgColor: '#ff0000' });
    expect(result).toBe(true);
  });

  it('可以自定义文字色', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '测试', { textColor: '#ffffff' });
    expect(result).toBe(true);
  });

  it('可以自定义边框色', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '测试', { borderColor: '#0000ff' });
    expect(result).toBe(true);
  });

  it('可以同时设置多个样式', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '自定义样式', {
      bgColor: '#e0f2fe',
      textColor: '#0369a1',
      borderColor: '#0ea5e9',
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '14px',
    });
    expect(result).toBe(true);
    expect(getAllComments()).toHaveLength(1);
  });

  it('可以隐藏箭头', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '无箭头', { showArrow: false });
    expect(result).toBe(true);
  });

  it('可以设置最大宽度', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    const result = comment('e1', '测试', { maxWidth: '300px' });
    expect(result).toBe(true);
  });
});

describe('updateComment - 带配置更新', () => {
  it('更新时可以传入新配置', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '原文本');
    updateComment('e1', '新文本', { position: 'top_center' });

    const all = getAllComments();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('新文本');
  });

  it('不带配置更新只改文本', () => {
    const root = el('<div><button data-testid="b1">删除</button></div>');
    document.body.appendChild(root);
    snapshot(root);

    comment('e1', '原文本');
    updateComment('e1', '新文本');

    expect(getAllComments()[0].text).toBe('新文本');
  });
});
