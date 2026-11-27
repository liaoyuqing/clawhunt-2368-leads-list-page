import { fireEvent, screen, waitFor } from '@testing-library/react';
import { useMockFailure, useRole } from './testSetupHelpers';
import { server } from '../mocks/node';
import { captureApi, lastHit } from './apiCapture';
import { renderAt, waitForRows } from './renderPage';

describe('列表页三态与排序', () => {
  it('states-loading-empty-error: 首屏显示加载骨架，数据到达后消失', async () => {
    useRole('advisor');
    renderAt('');
    expect(screen.getByTestId('leads-skeleton')).toBeTruthy();
    await waitForRows();
    expect(screen.queryByTestId('leads-skeleton')).toBeNull();
    expect(screen.getByTestId('leads-total')).toHaveTextContent('共 68 条线索');
  });

  it('states-loading-empty-error: 无结果时显示空状态，可一键清空筛选', async () => {
    useRole('advisor');
    renderAt('?keyword=' + encodeURIComponent('海市蜃楼集团'));
    await waitFor(() => expect(screen.getByTestId('leads-empty')).toBeTruthy());
    expect(screen.getByTestId('leads-total')).toHaveTextContent('共 0 条线索');
    fireEvent.click(screen.getByText('清空筛选'));
    await waitForRows();
    await waitFor(() => expect(window.location.search).toBe(''));
    expect(screen.queryByTestId('leads-empty')).toBeNull();
  });

  it('states-loading-empty-error: 接口 503 显示错误态，重试后恢复', async () => {
    useRole('advisor');
    useMockFailure(true);
    renderAt('');
    await waitFor(() => expect(screen.getByTestId('leads-error')).toBeTruthy());
    const error = screen.getByTestId('leads-error');
    expect(error).toHaveTextContent('线索加载失败');
    expect(error).toHaveTextContent('线索服务暂时不可用，请稍后重试');
    // 错误态下分页与批量入口都不渲染，避免在坏数据上操作
    expect(screen.queryByText('批量转派')).toBeNull();

    useMockFailure(false);
    fireEvent.click(screen.getByText('重试'));
    await waitForRows();
    expect(screen.queryByTestId('leads-error')).toBeNull();
  });

  it('states-loading-empty-error: 点击表头切换报备时间排序并写入 URL', async () => {
    useRole('advisor');
    const hits = captureApi(server);
    renderAt('');
    await waitForRows();
    const sortButton = screen.getByLabelText('按报备时间排序');
    expect(sortButton.textContent).toContain('↓');

    fireEvent.click(sortButton);
    await waitFor(() => expect(lastHit(hits, '/api/sales/leads').params.get('sort')).toBe('reportedAt:asc'));
    expect(window.location.search).toContain('sort=reportedAt%3Aasc');
    expect(screen.getByLabelText('按报备时间排序').textContent).toContain('↑');

    fireEvent.click(screen.getByLabelText('按报备时间排序'));
    await waitFor(() => expect(lastHit(hits, '/api/sales/leads').params.get('sort')).toBe('reportedAt:desc'));
  });
});