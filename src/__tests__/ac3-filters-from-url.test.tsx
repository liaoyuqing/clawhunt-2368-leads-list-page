import { screen, waitFor } from '@testing-library/react';
import { useRole } from './testSetupHelpers';
import { server } from '../mocks/node';
import { captureApi, type ApiHit, hitsFor, lastHit } from './apiCapture';
import { renderAt, waitForRole, waitForRows } from './renderPage';

function paramsOf(hit: ApiHit): Record<string, string> {
  return Object.fromEntries(hit.params.entries());
}

async function waitForLeadsRequests(hits: ApiHit[], count: number): Promise<void> {
  await waitFor(() => {
    expect(hitsFor(hits, '/api/sales/leads').length).toBe(count);
  });
}

describe('AC3 筛选条件同步 URL 且刷新后从 URL 恢复', () => {
  it('ac3-filters-from-url: 带 query 打开页面，条件既进请求参数也回填到界面控件', async () => {
    useRole('advisor');
    const hits = captureApi(server);
    renderAt('?stage=qualified,negotiating&source=referral&recycle=soon&size=50&sort=followedAt:asc');
    await waitForRole('顾问视角');
    await waitForLeadsRequests(hits, 1);
    await waitForRows();

    const hit = lastHit(hits, '/api/sales/leads');
    expect(hit.params.get('stage')).toBe('qualified,negotiating');
    expect(hit.params.get('source')).toBe('referral');
    expect(hit.params.get('recycle')).toBe('soon');
    expect(hit.params.get('size')).toBe('50');
    expect(hit.params.get('page')).toBe('1');
    expect(hit.params.get('sort')).toBe('followedAt:asc');

    // 界面回填：筛选摘要
    const summary = screen.getByTestId('active-filters');
    expect(summary).toHaveTextContent('阶段 已确认 / 洽谈中');
    expect(summary).toHaveTextContent('来源 老客户转介');
    expect(summary).toHaveTextContent('即将回收（3 天内）');
    expect(summary).toHaveTextContent('每页 50 条');
    // 控件回填：多选阶段标签、回收开关、排序箭头
    expect(screen.getByTestId('filter-stage')).toHaveTextContent('已确认');
    expect(screen.getByTestId('filter-stage')).toHaveTextContent('洽谈中');
    expect(screen.getByTestId('filter-recycle').querySelector('.t-is-checked')).toBeTruthy();
    const followedSort = screen.getByLabelText('按最近跟进时间排序');
    expect(followedSort.textContent).toContain('↑');
    expect(followedSort.className).toContain('sort-btn--active');
  });

  it('ac3-filters-from-url: 刷新（卸载后重新挂载、内存态清零）仍按同一 URL 条件请求', async () => {
    useRole('advisor');
    const hits = captureApi(server);
    const first = renderAt('?stage=contacted&sort=followedAt:desc&keyword=' + encodeURIComponent('科技'));
    await waitForRole('顾问视角');
    await waitForLeadsRequests(hits, 1);
    const before = paramsOf(lastHit(hits, '/api/sales/leads'));
    expect(before.stage).toBe('contacted');
    expect(before.sort).toBe('followedAt:desc');
    expect(before.keyword).toBe('科技');

    // 模拟浏览器刷新：组件整棵树卸载并重新挂载，地址栏不变
    first.unmount();
    renderAt(window.location.search);
    await waitForLeadsRequests(hits, 2);
    const after = paramsOf(lastHit(hits, '/api/sales/leads'));
    expect(after).toEqual(before);

    // 界面同样从 URL 恢复
    await waitFor(() => expect(screen.getByTestId('active-filters')).toHaveTextContent('阶段 已联系'));
    expect(screen.getByTestId('active-filters')).toHaveTextContent('关键词 科技');
    expect(screen.getByTestId('filter-stage')).toHaveTextContent('已联系');
    expect(window.location.search).toContain('stage=contacted');
  });

  it('ac3-filters-from-url: page / size 分页参数从 URL 恢复', async () => {
    useRole('advisor');
    const hits = captureApi(server);
    renderAt('?page=2&size=20');
    await waitForRole('顾问视角');
    await waitForLeadsRequests(hits, 1);
    const hit = lastHit(hits, '/api/sales/leads');
    expect(hit.params.get('page')).toBe('2');
    expect(hit.params.get('size')).toBe('20');
    await waitFor(() => expect(document.querySelectorAll('tbody tr').length).toBe(20));
    expect(screen.getByTestId('active-filters')).toHaveTextContent('第 2 页');
    expect(screen.getByTestId('leads-total')).toHaveTextContent('共 68 条线索');
  });

  it('ac3-filters-from-url: 非法 query 不白屏，回落默认条件', async () => {
    useRole('advisor');
    const hits = captureApi(server);
    renderAt('?stage=archived&source=fax&spaceType=space_station&sort=id:asc&page=0&size=999&recycle=maybe&reportedFrom=2026/11/01');
    await waitForRole('顾问视角');
    await waitForLeadsRequests(hits, 1);
    await waitForRows();

    const hit = lastHit(hits, '/api/sales/leads');
    expect(hit.params.get('stage')).toBeNull();
    expect(hit.params.get('source')).toBeNull();
    expect(hit.params.get('space_type')).toBeNull();
    expect(hit.params.get('recycle')).toBeNull();
    expect(hit.params.get('reported_from')).toBeNull();
    expect(hit.params.get('sort')).toBe('reportedAt:desc');
    expect(hit.params.get('page')).toBe('1');
    expect(hit.params.get('size')).toBe('20');
    expect(screen.queryByTestId('active-filters')).toBeNull();
    expect(screen.getByTestId('leads-total')).toHaveTextContent('共 68 条线索');
  });
});