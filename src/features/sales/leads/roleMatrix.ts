import type { RoleName } from '../../../api/types';

export interface RoleMatrix {
  role: RoleName;
  isAuthenticated: boolean;
  isReadOnly: boolean;
  /** 表格「负责人」列：顾问视角不渲染（不是 display:none） */
  showOwnerColumn: boolean;
  /** 筛选区「负责人」下拉：主管及以上才有 */
  showOwnerFilter: boolean;
  /** 工具栏「批量转派」按钮：顾问视角不渲染 */
  showBulkTransfer: boolean;
  canSort: boolean;
}

/**
 * 视角差异只在这里定义一次，表格列与工具栏按钮都从它派生，
 * 避免出现「列藏了、按钮还在」这类半套权限。
 */
export function roleMatrix(role: RoleName | null | undefined): RoleMatrix {
  const effective: RoleName = role ?? 'advisor';
  const elevated = effective === 'supervisor' || effective === 'manager';
  return {
    role: effective,
    isAuthenticated: Boolean(role),
    isReadOnly: role === null || role === undefined,
    showOwnerColumn: elevated,
    showOwnerFilter: elevated,
    showBulkTransfer: elevated,
    canSort: true,
  };
}
