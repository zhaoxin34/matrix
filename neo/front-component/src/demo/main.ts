/**
 * DomSnapshot Demo Page
 *
 * 静态结构在 index.html 里;
 * 这里只负责: 事件绑定、snapshot 同步、操作日志
 */

import { snapshot, click, fill, type SnapshotOptions, type SnapshotResult } from '../index.js';

// --- 应用状态 ---
const currentOptions: SnapshotOptions = {
  visibleOnly: true,
  interactiveOnly: true,
};
let lastResult: SnapshotResult | null = null;
const eventLog: { msg: string; ok: boolean }[] = [];

/** 打开弹窗后重新跑 snapshot */
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

  // snapshot 范围: demo site 自身
  lastResult = snapshot(document.getElementById('demo-site')!, opts);
  const out = document.getElementById('snapshot-output')!;
  // 同时展示 nodes / stats / meta,让 LLM 决策有完整上下文
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

/** 绑定控制面板 */
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

// --- 启动 ---
bindSiteEvents();
bindControls();
refresh();
addLog('DomSnapshot demo 已就绪', true);
