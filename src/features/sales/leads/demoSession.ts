import type { RoleName } from '../../../api/types';

/**
 * 演示用开关（真实环境由 S2-IAM 与后端决定，这里只为本地跑 demo 与组件测试提供入口）。
 * 两条约束刻意写死在这个模块里：
 * 1) 只落 sessionStorage：关标签页即失效，不会在下次打开时还留着一个坏状态；
 * 2) 接口异常开关带 TTL（默认 5 分钟）并在页面错误态提供「关闭演示开关并重试」，
 *    即使忘了关，过期后自动恢复正常，页面上永远有出路。
 */
export const ROLE_STORAGE_KEY = 'leads-demo-role';
export const FAIL_STORAGE_KEY = 'leads-demo-fail';
export const FAIL_TTL_MS = 5 * 60 * 1000;

function readSessionValue(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // 隐私模式下 sessionStorage 可能不可写：演示开关失灵不影响页面本身
  }
}

function removeSessionValue(key: string): void {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // 同上，清不掉也不阻断恢复流程
  }
}

export function readDemoRole(): RoleName {
  const raw = readSessionValue(ROLE_STORAGE_KEY);
  if (raw === 'supervisor' || raw === 'manager' || raw === 'advisor') return raw;
  return 'advisor';
}

export function writeDemoRole(role: RoleName): void {
  writeSessionValue(ROLE_STORAGE_KEY, role);
}

/** 开关是否生效：值必须是 '1' 且未过期；过期即刻自清，避免把页面卡在错误态 */
export function isMockFailureOn(now: number = Date.now()): boolean {
  if (readSessionValue(FAIL_STORAGE_KEY) !== '1') return false;
  const until = Number(readSessionValue(FAIL_STORAGE_KEY + '-until') ?? '0');
  if (!Number.isFinite(until) || until <= now) {
    setMockFailure(false);
    return false;
  }
  return true;
}

export function setMockFailure(on: boolean, now: number = Date.now()): void {
  if (on) {
    writeSessionValue(FAIL_STORAGE_KEY, '1');
    writeSessionValue(FAIL_STORAGE_KEY + '-until', String(now + FAIL_TTL_MS));
    return;
  }
  removeSessionValue(FAIL_STORAGE_KEY);
  removeSessionValue(FAIL_STORAGE_KEY + '-until');
}
