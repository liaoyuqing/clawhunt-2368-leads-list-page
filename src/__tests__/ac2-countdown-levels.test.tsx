import { screen, waitFor } from '@testing-library/react';
import { ROLE_STORAGE_KEY } from '../features/sales/leads/demoSession';
import { countdownLevel, formatCountdown, hasRecycleCountdown } from '../features/sales/leads/countdown';
import { renderAt, waitForRows } from './renderPage';

function countdownOf(id: string): HTMLElement {
  return screen.getByTestId('countdown-' + id);
}

function levelOf(id: string): string | null {
  return countdownOf(id).getAttribute('data-level');
}

describe('AC2 距回收倒计时分级与着色', () => {
  it('ac2-countdown-levels: 分级口径 ≤2 红 / 3-4 橙 / 公海与合同不显示', () => {
    expect(countdownLevel(0, 'qualified')).toBe('danger');
    expect(countdownLevel(1, 'qualified')).toBe('danger');
    expect(countdownLevel(2, 'negotiating')).toBe('danger');
    expect(countdownLevel(3, 'qualified')).toBe('warn');
    expect(countdownLevel(4, 'new')).toBe('warn');
    expect(countdownLevel(5, 'qualified')).toBeNull();
    expect(countdownLevel(30, 'contacted')).toBeNull();
    // 公海与合同及以后没有回收倒计时
    expect(countdownLevel(1, 'public_pool')).toBeNull();
    expect(countdownLevel(1, 'contract')).toBeNull();
    expect(hasRecycleCountdown('public_pool')).toBe(false);
    expect(hasRecycleCountdown('contract')).toBe(false);
    expect(hasRecycleCountdown('qualified')).toBe(true);
    // 已过期不涂红，交后端过滤
    expect(countdownLevel(-1, 'qualified')).toBeNull();
    expect(countdownLevel(null, 'qualified')).toBeNull();
    expect(formatCountdown(0, 'qualified')).toBe('今天到期');
    expect(formatCountdown(2, 'qualified')).toBe('2 天');
    expect(formatCountdown(null, 'public_pool')).toBe('—');
    expect(formatCountdown(null, 'contract')).toBe('—');
  });

  it('ac2-countdown-levels: 列表行按 daysLeft 渲染红色/橙色倒计时文案', async () => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, 'advisor');
    renderAt('');
    await waitForRows();

    await waitFor(() => expect(countdownOf('L-0001')).toBeTruthy());
    // L-0001 距回收 1 天 → 红
    expect(levelOf('L-0001')).toBe('danger');
    expect(countdownOf('L-0001').className).toContain('countdown--danger');
    expect(countdownOf('L-0001')).toHaveTextContent('1 天');
    // L-0002 距回收 2 天 → 红（边界值）
    expect(levelOf('L-0002')).toBe('danger');
    // L-0003 距回收 3 天 → 橙（边界值）
    expect(levelOf('L-0003')).toBe('warn');
    expect(countdownOf('L-0003').className).toContain('countdown--warn');
    expect(countdownOf('L-0003')).toHaveTextContent('3 天');
    // L-0004 距回收 4 天 → 橙（边界值）
    expect(levelOf('L-0004')).toBe('warn');
    // L-0005 当天到期 → 红
    expect(levelOf('L-0005')).toBe('danger');
    expect(countdownOf('L-0005')).toHaveTextContent('今天到期');
    // L-0006 距回收 10 天 → 不着色
    expect(levelOf('L-0006')).toBe('none');
    expect(countdownOf('L-0006').className).toBe('countdown');
  });

  it('ac2-countdown-levels: 公海与合同阶段的距回收列显示「—」且不着色', async () => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, 'advisor');
    renderAt('?stage=public_pool,contract&size=100');
    await waitForRows();
    await waitFor(() => expect(screen.getAllByTestId(/^countdown-L-/).length).toBeGreaterThan(10));
    const cells = screen.getAllByTestId(/^countdown-L-/);
    expect(cells.length).toBe(16);
    cells.forEach((cell) => {
      expect(cell.getAttribute('data-level')).toBe('none');
      expect(cell.textContent).toBe('—');
    });
  });
});
