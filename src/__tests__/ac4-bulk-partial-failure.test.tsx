import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { ROLE_STORAGE_KEY } from '../features/sales/leads/demoSession';
import { server } from '../mocks/node';
import { captureApi, type ApiHit } from './apiCapture';
import { renderAt, waitForRole, waitForRows } from './renderPage';

/** 9 条：其中 L-0009 会被 409 拒绝、L-0014 会被 403 拒绝，其余 7 条成功 */
const PICKED = [
  '星屿数字科技',
  '衡川智能装备',
  '青禾品牌管理',
  '澜途供应链',
  '北辰数据实验室',
  '云栖建筑事务所',
  '远岫文旅集团',
  '沐辰新材料',
  '承影视觉设计',
];

function transferHits(hits: ApiHit[]): ApiHit[] {
  return hits.filter((hit) => hit.method === 'PATCH');
}

async function openDialogAndPickAdvisor(): Promise<HTMLElement> {
  fireEvent.click(screen.getByText('批量转派'));
  const dialog = await waitFor(() => {
    const el = document.querySelector('.t-dialog');
    if (!el) throw new Error('批量转派弹窗没有打开');
    return el as HTMLElement;
  });
  await waitFor(() => {
    expect(within(dialog).getByRole('button', { name: '周牧野' })).toBeTruthy();
  });
  fireEvent.click(within(dialog).getByRole('button', { name: '周牧野' }));
  return dialog;
}

describe('AC4 批量转派部分失败时逐条展示失败原因', () => {
  it('ac4-bulk-partial-failure: 9 条里 2 条失败，逐条列出企业名与失败原因', async () => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, 'supervisor');
    const hits = captureApi(server);
    renderAt('');
    await waitForRole('主管视角');
    await waitForRows();

    PICKED.forEach((company) => {
      fireEvent.click(screen.getByLabelText('选择 ' + company));
    });
    await waitFor(() => expect(screen.getByTestId('selected-count')).toHaveTextContent('已选 9 条'));

    const dialog = await openDialogAndPickAdvisor();
    fireEvent.click(within(dialog).getByRole('button', { name: '开始转派' }));

    await waitFor(() => {
      expect(screen.getByTestId('transfer-summary')).toHaveTextContent('成功 7 条，失败 2 条');
    }, { timeout: 15000 });

    // 逐条失败原因：企业名 + 后端返回的原因
    const failures = screen.getAllByTestId('transfer-failure-row');
    expect(failures).toHaveLength(2);
    expect(failures[0]).toHaveTextContent('沐辰新材料');
    expect(failures[0]).toHaveTextContent('该线索已被他人转派');
    expect(failures[1]).toHaveTextContent('承影视觉设计');
    expect(failures[1]).toHaveTextContent('目标顾问无该会所权限');

    // 逐条调用：9 条各发一次 PATCH，且都是转给周牧野
    const patches = transferHits(hits);
    expect(patches).toHaveLength(9);
    expect(patches.map((hit) => hit.path).sort()).toEqual(
      [
        '/api/sales/leads/L-0001/owner',
        '/api/sales/leads/L-0002/owner',
        '/api/sales/leads/L-0003/owner',
        '/api/sales/leads/L-0004/owner',
        '/api/sales/leads/L-0005/owner',
        '/api/sales/leads/L-0006/owner',
        '/api/sales/leads/L-0008/owner',
        '/api/sales/leads/L-0009/owner',
        '/api/sales/leads/L-0014/owner',
      ].sort(),
    );
  });

  it('ac4-bulk-partial-failure: 失败项可单独重试，重试不影响已成功项', async () => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, 'supervisor');
    const hits = captureApi(server);
    renderAt('');
    await waitForRole('主管视角');
    await waitForRows();

    PICKED.forEach((company) => {
      fireEvent.click(screen.getByLabelText('选择 ' + company));
    });
    const dialog = await openDialogAndPickAdvisor();
    fireEvent.click(within(dialog).getByRole('button', { name: '开始转派' }));
    await waitFor(() => {
      expect(screen.getByTestId('transfer-summary')).toHaveTextContent('成功 7 条，失败 2 条');
    }, { timeout: 15000 });

    fireEvent.click(screen.getByText('仅重试失败 2 条'));
    await waitFor(() => expect(transferHits(hits)).toHaveLength(11), { timeout: 15000 });
    expect(transferHits(hits).slice(9).map((hit) => hit.path)).toEqual([
      '/api/sales/leads/L-0009/owner',
      '/api/sales/leads/L-0014/owner',
    ]);
    await waitFor(() => {
      expect(screen.getByTestId('transfer-summary')).toHaveTextContent('成功 7 条，失败 2 条');
    });
    expect(screen.getAllByTestId('transfer-failure-row')).toHaveLength(2);

    // 关闭弹窗后，失败的 2 条仍保持勾选，便于继续处理
    fireEvent.click(screen.getByText('关闭'));
    await waitFor(() => expect(document.querySelector('.t-dialog')).toBeNull());
    expect(screen.getByTestId('selected-count')).toHaveTextContent('已选 2 条');
  });

  it('ac4-bulk-partial-failure: 全部成功时不显示失败明细', async () => {
    window.localStorage.setItem(ROLE_STORAGE_KEY, 'supervisor');
    const hits = captureApi(server);
    renderAt('');
    await waitForRole('主管视角');
    await waitForRows();

    fireEvent.click(screen.getByLabelText('选择 衡川智能装备'));
    fireEvent.click(screen.getByLabelText('选择 青禾品牌管理'));
    const dialog = await openDialogAndPickAdvisor();
    fireEvent.click(within(dialog).getByRole('button', { name: '开始转派' }));
    await waitFor(() => {
      expect(screen.getByTestId('transfer-summary')).toHaveTextContent('全部 2 条转派成功');
    }, { timeout: 15000 });
    expect(screen.queryByTestId('transfer-failure-row')).toBeNull();
    expect(transferHits(hits)).toHaveLength(2);
  });
});
