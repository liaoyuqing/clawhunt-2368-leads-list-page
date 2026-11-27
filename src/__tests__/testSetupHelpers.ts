import { ROLE_STORAGE_KEY, setMockFailure } from '../features/sales/leads/demoSession';
import type { RoleName } from '../api/types';

/** 测试里用真实开关函数（而不是直接写 storage key），避免测试与实现的键名/语义脱节 */
export function useRole(role: RoleName): void {
  window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
}

export function useMockFailure(on: boolean): void {
  setMockFailure(on);
}
