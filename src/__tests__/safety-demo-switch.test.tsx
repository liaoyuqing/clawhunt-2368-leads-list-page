import { fireEvent, screen, waitFor } from '@testing-library/react';
import { FAIL_STORAGE_KEY, FAIL_TTL_MS, isMockFailureOn, setMockFailure } from '../features/sales/leads/demoSession';
import { useMockFailure, useRole } from './testSetupHelpers';
import { renderAt, waitForRows } from './renderPage';

describe('演示开关的安全性：不残留、可自愈、不侵入生产代码', () => {
  it('safety-demo-switch: 接口异常开关带 TTL，过期即自动清除', () => {
    const base = 1_700_000_000_000;
    setMockFailure(true, base);
    // 未过期：生效
    expect(isMockFailureOn(base + FAIL_TTL_MS - 1)).toBe(true);
    // 过期：立刻失效，且键被清掉，不会在下次会话里还留着
    expect(isMockFailureOn(base + FAIL_TTL_MS + 1)).toBe(false);
    expect(window.sessionStorage.getItem(FAIL_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(FAIL_STORAGE_KEY + '-until')).toBeNull();
  });

  it('safety-demo-switch: 关掉开关会清掉键，页面不会停留在坏状态', () => {
    setMockFailure(true);
    expect(isMockFailureOn()).toBe(true);
    setMockFailure(false);
    expect(isMockFailureOn()).toBe(false);
    expect(window.sessionStorage.getItem(FAIL_STORAGE_KEY)).toBeNull();
    expect(window.sessionStorage.length).toBe(0);
  });

  it('safety-demo-switch: 错误态提供「关闭演示开关并重试」，一键恢复列表', async () => {
    useRole('advisor');
    useMockFailure(true);
    renderAt('');
    await waitFor(() => expect(screen.getByTestId('leads-error')).toBeTruthy());
    const recover = screen.getByText('关闭演示开关并重试');
    fireEvent.click(recover);
    await waitForRows();
    expect(screen.queryByTestId('leads-error')).toBeNull();
    expect(isMockFailureOn()).toBe(false);
    expect(screen.getByTestId('leads-total')).toHaveTextContent('共 68 条线索');
  });
});
