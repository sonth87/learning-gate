/**
 * Test mẫu cho `npm run sd:test` (T1.4): kiểm bộ chạy test hoạt động và
 * các hàm thuần của workpath mà feature này dùng lại.
 */
import { emptyState } from '@/features/workpath/logic';

function assert(cond: unknown, msg: string): void {
  if (!cond) {
    console.error(`[smoke] FAIL: ${msg}`);
    process.exit(1);
  }
}

const s = emptyState();
assert(s.xp === 0, 'emptyState có xp = 0');
assert(typeof s.lessons === 'object' && Object.keys(s.lessons).length === 0, 'emptyState không có bài đã đọc');
assert(Array.isArray(s.log) && s.log.length === 0, 'emptyState có log rỗng');

console.log('[smoke] OK');
