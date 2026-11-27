import type { RoleName } from '../api/types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toIsoDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

/**
 * mock 层的时钟：默认取运行当天，可用 VITE_MOCK_DATE=YYYY-MM-DD 钉住，
 * 让假数据里的报备时间与回收时间始终相对「今天」生成，不需要改代码就能复现。
 * 只给 src/mocks 用；生产数据路径（src/api）不引用本模块，见 mocks-isolation 测试。
 */
function resolveMockNow(): Date {
  const pinned = import.meta.env.VITE_MOCK_DATE;
  if (typeof pinned === 'string' && ISO_DATE.test(pinned)) {
    const [year, month, day] = pinned.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
}

export const MOCK_NOW = resolveMockNow();

/** 服务端基准日，接口响应里的 serverDate 与倒计时都以它为准 */
export const MOCK_SERVER_DATE = toIsoDay(MOCK_NOW);

export type DemoRole = RoleName;
