/**
 * DomSnapshot Demo Page
 *
 * 静态结构在 index.html 里;
 * 这里只负责: 事件绑定、snapshot 同步、操作日志、tab 切换
 */

import {
  snapshot,
  click,
  fill,
  type SnapshotOptions,
  type SnapshotResult,
} from '../../src/dom-snapshot/index.js';
import {
  comment,
  removeComment,
  getAllComments,
  clearAllComments,
} from '../../src/dom-snapshot/comment.js';

// --- 应用状态 ---
const currentOptions: SnapshotOptions = {
  visibleOnly: true,
  interactiveOnly: true,
};
let lastResult: SnapshotResult | null = null;
const eventLog: { msg: string; ok: boolean }[] = [];

/** 跑一次 snapshot 并把结果写到右侧 JSON 区 */
function refresh() {
  const opts: SnapshotOptions = { ...currentOptions };
  if (!(document.getElementById('opt-visible') as HTMLInputElement).checked) {
    opts.visibleOnly = false;
  }
  if (!(document.getElementById('opt-interactive') as HTMLInputElement).checked) {
    opts.interactiveOnly = false;
  }
  if ((document.getElementById('opt-include-heading') as HTMLInputElement).checked) {
    opts.include = ['h1', 'h2', 'h3'];
  }
  // 把 tab 导航栏本身排除,让 JSON 只反映当前 tab 内容的变化
  opts.exclude = ['.tabs'];

  // snapshot 范围: demo site 自身
  lastResult = snapshot(document.getElementById('demo-site')!, opts);
  const out = document.getElementById('snapshot-output')!;
  out.textContent = JSON.stringify(
    {
      nodes: lastResult.nodes,
      stats: lastResult.stats,
      meta: lastResult.meta,
    },
    null,
    2,
  );
}

/** 用 DOM API 渲染日志(避免 XSS) */
function addLog(msg: string, ok: boolean) {
  eventLog.unshift({ msg, ok });
  if (eventLog.length > 20) eventLog.length = 20;
  const el = document.getElementById('event-log')!;
  el.replaceChildren();
  for (const entry of eventLog) {
    const row = document.createElement('div');
    row.className = 'row';
    const icon = document.createElement('span');
    icon.className = entry.ok ? 'ok' : 'err';
    icon.textContent = entry.ok ? '✓' : '✗';
    row.appendChild(icon);
    row.appendChild(document.createTextNode(` ${entry.msg}`));
    el.appendChild(row);
  }
}

/** 选中 data-testid 元素的通用 helper,避免重复写 querySelector */
function byTestId(testId: string): Element | null {
  return document.querySelector(`[data-testid="${testId}"]`);
}

/** 绑定 demo site 内部按钮/链接事件 */
function bindSiteEvents() {
  document.querySelector('[data-action="open-modal"]')?.addEventListener('click', () => {
    document.getElementById('modal-mask')!.classList.add('open');
    refresh();
  });
  byTestId('btn-cancel')?.addEventListener('click', () => {
    document.getElementById('modal-mask')!.classList.remove('open');
    refresh();
  });
  byTestId('btn-confirm')?.addEventListener('click', () => {
    document.getElementById('modal-mask')!.classList.remove('open');
    addLog('点击了 [确认] 按钮', true);
    refresh();
  });
  byTestId('btn-login')?.addEventListener('click', () => {
    const u = (byTestId('input-username') as HTMLInputElement | null)?.value ?? '';
    const p = (byTestId('input-password') as HTMLInputElement | null)?.value ?? '';
    addLog(`登录表单提交: username=${u || '(空)'}, password=${p || '(空)'}`, true);
  });
  byTestId('btn-search')?.addEventListener('click', () => {
    const q = (byTestId('input-search') as HTMLInputElement | null)?.value ?? '';
    addLog(`搜索: ${q || '(空)'}`, true);
  });
  byTestId('btn-register')?.addEventListener('click', () => {
    addLog('点击了 [注册] 按钮', true);
  });
  byTestId('link-forgot')?.addEventListener('click', (e) => {
    e.preventDefault();
    addLog('点击了 [忘记密码] 链接', true);
  });
  byTestId('chk-remember')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    addLog(`记住我 切换为: ${checked}`, true);
  });
}

/** 绑定右侧控制面板(visibleOnly / interactiveOnly / fill / click / copy) */
function bindControls() {
  document.getElementById('opt-visible')?.addEventListener('change', refresh);
  document.getElementById('opt-interactive')?.addEventListener('change', refresh);
  document.getElementById('opt-include-heading')?.addEventListener('change', refresh);

  document.getElementById('ctl-fill-btn')?.addEventListener('click', () => {
    const id = (document.getElementById('ctl-fill-id') as HTMLInputElement).value.trim();
    const v = (document.getElementById('ctl-fill-value') as HTMLInputElement).value;
    if (!id) {
      addLog('fill: 请先填入 id', false);
      return;
    }
    const r = fill(id, v, lastResult ?? undefined);
    addLog(`fill(${id}, "${v}") → ${r.ok ? 'ok' : r.message}`, r.ok);
    refresh();
  });

  document.getElementById('ctl-click-btn')?.addEventListener('click', () => {
    const id = (document.getElementById('ctl-click-id') as HTMLInputElement).value.trim();
    if (!id) {
      addLog('click: 请先填入 id', false);
      return;
    }
    const r = click(id, lastResult ?? undefined);
    addLog(`click(${id}) → ${r.ok ? 'ok' : r.message}`, r.ok);
    refresh();
  });

  document.querySelector('[data-action="copy-json"]')?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            nodes: lastResult?.nodes ?? [],
            stats: lastResult?.stats,
            meta: lastResult?.meta,
          },
          null,
          2,
        ),
      );
      addLog('JSON 已复制到剪贴板', true);
    } catch {
      addLog('复制失败: 当前浏览器不支持 Clipboard API', false);
    }
  });
}

/** 绑定注释功能 */
function bindAnnotationControls() {
  const controls = document.getElementById('annotation-controls');
  const idInput = document.getElementById('anno-id') as HTMLInputElement;
  const textInput = document.getElementById('anno-text') as HTMLInputElement;
  const listOutput = document.getElementById('annotation-list') as HTMLPreElement;

  // 显示注释控制区
  if (controls) {
    controls.style.display = 'block';
  }

  // 添加注释
  document.getElementById('btn-add-anno')?.addEventListener('click', () => {
    const id = idInput.value.trim();
    const text = textInput.value.trim();

    if (!id) {
      addLog('添加注释: 请先填入元素 ID', false);
      return;
    }
    if (!text) {
      addLog('添加注释: 请填入注释内容', false);
      return;
    }

    const ok = comment(id, text);
    if (ok) {
      addLog(`添加注释: ${id} → "${text}"`, true);
      textInput.value = ''; // 清空注释内容
    } else {
      addLog(`添加注释失败: 找不到 id=${id}，请先获取 Snapshot`, false);
    }
  });

  // 清除全部注释
  document.getElementById('btn-clear-anno')?.addEventListener('click', () => {
    clearAllComments();
    addLog('已清除所有注释', true);
    if (listOutput) {
      listOutput.style.display = 'none';
    }
  });

  // 查看注释列表
  document.getElementById('btn-list-anno')?.addEventListener('click', () => {
    const all = getAllComments();
    if (all.length === 0) {
      addLog('暂无注释', true);
      if (listOutput) {
        listOutput.style.display = 'none';
      }
      return;
    }

    const lines = all.map((c) => `  { id: "${c.id}", text: "${c.text}" }`);
    const text = `共有 ${all.length} 个注释:\n[\n${lines.join(',\n')}\n]`;

    if (listOutput) {
      listOutput.textContent = text;
      listOutput.style.display = 'block';
    }
    addLog(`已显示 ${all.length} 个注释`, true);
  });

  // 回车快捷添加
  textInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('btn-add-anno')?.dispatchEvent(new MouseEvent('click'));
    }
  });
}

/**
 * 绑定 tab 切换:
 *   - 点击 tab 按钮 → 切换 active 状态 + 切换面板显示
 *   - 同步右侧 badge 显示当前 tab 名
 *   - 重新跑 snapshot(非活跃 tab 用 display:none,isVisible 自动过滤)
 */
function bindTabs() {
  const tabs = document.querySelectorAll<HTMLButtonElement>('.tab');
  const panels = document.querySelectorAll<HTMLElement>('.tab-panel');
  const badge = document.getElementById('current-tab-badge');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      if (!target) return;

      // tab 按钮 active 状态
      tabs.forEach((t) => {
        const isActive = t === tab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });

      // 面板显示
      panels.forEach((p) => {
        const isActive = p.dataset.panel === target;
        p.classList.toggle('active', isActive);
        if (isActive) {
          p.removeAttribute('hidden');
        } else {
          p.setAttribute('hidden', '');
        }
      });

      // 同步右侧 badge
      if (badge) badge.textContent = tab.textContent?.trim() ?? '';

      // 重跑 snapshot
      refresh();
      addLog(`切换到 tab: ${tab.textContent?.trim()}`, true);
    });
  });
}

// --- 启动 ---
bindSiteEvents();
bindControls();
bindAnnotationControls();
bindTabs();
refresh();
addLog('DomSnapshot demo 已就绪', true);
