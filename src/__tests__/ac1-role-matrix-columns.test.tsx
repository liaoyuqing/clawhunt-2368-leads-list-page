import { screen } from '@testing-library/react';
import { useRole } from './testSetupHelpers';
import { roleMatrix } from '../features/sales/leads/roleMatrix';
import { renderAt, waitForRole, waitForRows } from './renderPage';

function headerText(): string {
  const head = document.querySelector('thead');
  return head && head.textContent ? head.textContent : '';
}

function headerCellCount(): number {
  return document.querySelectorAll('thead th').length;
}

describe('AC1 顾问视角与主管视角的列/按钮差异', () => {
  it('ac1-role-matrix-columns: 顾问视角不渲染负责人列与批量转派按钮', async () => {
    useRole('advisor');
    renderAt('');
    await waitForRole('顾问视角');
    await waitForRows();

    // 负责人列：表头里根本没有这两个字（不是 display:none 藏起来）
    expect(headerText()).not.toContain('负责人');
    // 筛选区的负责人下拉也不该出现
    expect(screen.queryByTestId('filter-owner')).toBeNull();
    // 批量转派按钮不存在（TDesign 的 disabled 按钮渲染成 div，这里按文案查，不依赖标签名）
    expect(screen.queryByText('批量转派')).toBeNull();
    // 没有勾选列
    expect(document.querySelectorAll('input[aria-label="选择本页全部"]').length).toBe(0);
    expect(screen.queryByLabelText('选择 星屿数字科技')).toBeNull();
    // 8 个数据列：企业名/行业/来源/阶段/报备/跟进/距回收/意向工位数
    expect(headerCellCount()).toBe(8);
    expect(headerText()).toContain('企业名');
    expect(headerText()).toContain('距回收天数');
    expect(headerText()).toContain('意向工位数');
  });

  it('ac1-role-matrix-columns: 主管视角渲染负责人列、勾选列与批量转派按钮', async () => {
    useRole('supervisor');
    renderAt('');
    await waitForRole('主管视角');
    await waitForRows();

    expect(headerText()).toContain('负责人');
    expect(screen.getByTestId('filter-owner')).toBeTruthy();
    expect(screen.getByText('批量转派')).toBeTruthy();
    expect(screen.getByLabelText('选择本页全部')).toBeTruthy();
    // 9 个数据列 + 1 个勾选列
    expect(headerCellCount()).toBe(10);
  });

  it('ac1-role-matrix-columns: 权限矩阵单一来源，unknown 角色按只读顾问处理', () => {
    expect(roleMatrix('advisor')).toMatchObject({
      showOwnerColumn: false,
      showOwnerFilter: false,
      showBulkTransfer: false,
      isAuthenticated: true,
    });
    expect(roleMatrix('supervisor')).toMatchObject({
      showOwnerColumn: true,
      showOwnerFilter: true,
      showBulkTransfer: true,
    });
    expect(roleMatrix('manager').showBulkTransfer).toBe(true);
    expect(roleMatrix(null).showOwnerColumn).toBe(false);
    expect(roleMatrix(null).isReadOnly).toBe(true);
  });
});