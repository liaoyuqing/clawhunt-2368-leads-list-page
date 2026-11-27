import type { Stage } from '../../../api/types';

/** 阶段顺序：公海在最前，合同及以后（含未来阶段）都不再有「被回收」这件事 */
export const STAGE_ORDER: Stage[] = ['public_pool', 'new', 'contacted', 'qualified', 'negotiating', 'contract'];

export type CountdownLevel = 'danger' | 'warn';

export function hasRecycleCountdown(stage: Stage): boolean {
  if (stage === 'public_pool') return false;
  const index = STAGE_ORDER.indexOf(stage);
  if (index < 0) return false;
  return index < STAGE_ORDER.indexOf('contract');
}

/**
 * 倒计时口径（唯一实现，表格与测试都走这里）：
 * - 公海 / 合同及以后：没有回收倒计时，返回 null，界面显示「—」
 * - daysLeft <= 2：danger（红）
 * - 3 <= daysLeft <= 4：warn（橙）
 * - 其余：null（正常色）
 * - 负数（已过回收日）不涂红：口径上不该出现在列表里，返回 null 交后端过滤
 */
export function countdownLevel(daysLeft: number | null | undefined, stage: Stage): CountdownLevel | null {
  if (!hasRecycleCountdown(stage)) return null;
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft < 0) return null;
  if (daysLeft <= 2) return 'danger';
  if (daysLeft <= 4) return 'warn';
  return null;
}

export function formatCountdown(daysLeft: number | null | undefined, stage: Stage): string {
  if (!hasRecycleCountdown(stage)) return '—';
  if (daysLeft === null || daysLeft === undefined) return '—';
  if (daysLeft < 0) return '—';
  return daysLeft === 0 ? '今天到期' : daysLeft + ' 天';
}
