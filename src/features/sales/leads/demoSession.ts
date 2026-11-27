import type { RoleName } from '../../../api/types';

/** mock 阶段用的两个本地开关：演示视角、接口异常模拟（真实环境由 S2-IAM 与后端决定） */
export const ROLE_STORAGE_KEY = 'leads-demo-role';
export const FAIL_STORAGE_KEY = 'leads-demo-fail';

export function readDemoRole(): RoleName {
  const raw = window.localStorage.getItem(ROLE_STORAGE_KEY);
  if (raw === 'supervisor' || raw === 'manager' || raw === 'advisor') return raw;
  return 'advisor';
}

export function writeDemoRole(role: RoleName): void {
  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function isMockFailureOn(): boolean {
  return window.localStorage.getItem(FAIL_STORAGE_KEY) === '1';
}

export function setMockFailure(on: boolean): void {
  window.localStorage.setItem(FAIL_STORAGE_KEY, on ? '1' : '0');
}
