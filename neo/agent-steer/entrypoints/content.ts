import { record } from 'rrweb'

export default defineContentScript({
  matches: ['*://*.google.com/*'],
  runAt: 'document_start',
  main() {
    // 启动 rrweb 录制但不存事件 (只验证它能加载)
    record({ emit: () => {} })
  },
})
