import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Pagination, Select } from 'tdesign-react';
import { leadsApi } from '../../../api/client';
import type { Advisor, LeadRow, RoleName } from '../../../api/types';
import BulkTransferDialog, { type TransferTarget } from '../../../components/BulkTransferDialog';
import { setMockFailure } from '../../../features/sales/leads/demoSession';
import {
  CHANNEL_OPTIONS,
  type LeadFilters,
  type PageSize,
  SPACE_TYPE_OPTIONS,
  STAGE_OPTIONS,
  type SortKey,
} from '../../../features/sales/leads/filters';
import { roleMatrix } from '../../../features/sales/leads/roleMatrix';
import { useSession } from '../../../features/sales/leads/useSession';
import { useUrlFilters } from '../../../features/sales/leads/useUrlFilters';
import FilterBar from './FilterBar';
import LeadsTable from './LeadsTable';

type LoadStatus = 'loading' | 'ready' | 'error';

const SHOW_DEMO_CONTROLS = import.meta.env.MODE !== 'test';

function stageLabel(stage: string): string {
  return STAGE_OPTIONS.find((item) => item.value === stage)?.label ?? stage;
}

function describeFilters(filters: LeadFilters, ownerName: string): string[] {
  const segments: string[] = [];
  if (filters.stages.length) segments.push('阶段 ' + filters.stages.map(stageLabel).join(' / '));
  if (filters.channel) {
    const label = CHANNEL_OPTIONS.find((item) => item.value === filters.channel)?.label ?? filters.channel;
    segments.push('来源 ' + label);
  }
  if (filters.spaceType) {
    const label = SPACE_TYPE_OPTIONS.find((item) => item.value === filters.spaceType)?.label ?? filters.spaceType;
    segments.push('空间类型 ' + label);
  }
  if (filters.reportedFrom || filters.reportedTo) {
    segments.push('报备 ' + (filters.reportedFrom || '不限') + ' ~ ' + (filters.reportedTo || '不限'));
  }
  if (filters.followedFrom || filters.followedTo) {
    segments.push('跟进 ' + (filters.followedFrom || '不限') + ' ~ ' + (filters.followedTo || '不限'));
  }
  if (filters.recycleSoon) segments.push('即将回收（3 天内）');
  if (filters.keyword) segments.push('关键词 ' + filters.keyword);
  if (filters.ownerId) segments.push('负责人 ' + (ownerName || filters.ownerId));
  if (filters.page > 1) segments.push('第 ' + filters.page + ' 页');
  if (filters.size !== 20) segments.push('每页 ' + filters.size + ' 条');
  return segments;
}

function TableSkeleton() {
  return (
    <div className="skeleton" data-testid="leads-skeleton" aria-busy="true" aria-label="线索加载中">
      {[0, 1, 2, 3, 4, 5].map((row) => (
        <div className="skeleton__row" key={row}>
          <span className="skeleton__bar" />
        </div>
      ))}
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="state-box state-box--error" data-testid="leads-error" role="alert">
      <p className="state-box__title">线索加载失败</p>
      <p className="state-box__text">{message}</p>
      <Button theme="primary" variant="outline" onClick={onRetry}>
        重试
      </Button>
    </div>
  );
}

interface EmptyStateProps {
  onReset: () => void;
}

function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="state-box" data-testid="leads-empty">
      <p className="state-box__title">没有符合条件的线索</p>
      <p className="state-box__text">试试放宽筛选条件，或清空全部筛选重新查看。</p>
      <Button theme="default" variant="outline" onClick={onReset}>
        清空筛选
      </Button>
    </div>
  );
}

export default function LeadsPage() {
  const { filters, push, replace } = useUrlFilters();
  const { info, error: sessionError, setDemoRole } = useSession();
  const matrix = useMemo(() => roleMatrix(info?.role), [info?.role]);

  const [rows, setRows] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorText, setErrorText] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transferVisible, setTransferVisible] = useState(false);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    leadsApi
      .fetchLeads(filters)
      .then((response) => {
        if (!alive) return;
        setRows(response.items);
        setTotal(response.total);
        setStatus('ready');
        setErrorText('');
      })
      .catch((error: unknown) => {
        if (!alive) return;
        setErrorText(error instanceof Error ? error.message : '未知错误');
        setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [filters, reloadToken]);

  useEffect(() => {
    setSelectedIds([]);
  }, [filters]);

  useEffect(() => {
    if (!matrix.showOwnerFilter) {
      setAdvisors([]);
      return;
    }
    let alive = true;
    leadsApi
      .fetchAdvisors()
      .then((list) => {
        if (alive) setAdvisors(list);
      })
      .catch(() => {
        if (alive) setAdvisors([]);
      });
    return () => {
      alive = false;
    };
  }, [matrix.showOwnerFilter]);

  const handleFilterChange = useCallback(
    (patch: Partial<LeadFilters>, mode: 'push' | 'replace' = 'push') => {
      const next: LeadFilters = { ...filters, ...patch };
      if (!('page' in patch)) next.page = 1;
      if (mode === 'replace') replace(next);
      else push(next);
    },
    [filters, push, replace],
  );

  const handleSortChange = useCallback(
    (field: 'reportedAt' | 'followedAt') => {
      const next: SortKey = (filters.sort === field + ':desc' ? field + ':asc' : field + ':desc') as SortKey;
      handleFilterChange({ sort: next });
    },
    [filters.sort, handleFilterChange],
  );

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((previous) => {
      const pageIds = rows.map((row) => row.id);
      const allSelected = pageIds.length > 0 && pageIds.every((id) => previous.includes(id));
      if (allSelected) return previous.filter((id) => !pageIds.includes(id));
      return Array.from(new Set([...previous, ...pageIds]));
    });
  }, [rows]);

  const resetFilters = useCallback(() => {
    push({
      ...filters,
      stages: [],
      channel: '',
      spaceType: '',
      reportedFrom: '',
      reportedTo: '',
      followedFrom: '',
      followedTo: '',
      recycleSoon: false,
      keyword: '',
      ownerId: '',
      page: 1,
    });
  }, [filters, push]);

  const ownerName = useMemo(
    () => advisors.find((item) => item.id === filters.ownerId)?.name ?? '',
    [advisors, filters.ownerId],
  );

  const segments = useMemo(() => describeFilters(filters, ownerName), [filters, ownerName]);

  const transferTargets: TransferTarget[] = useMemo(
    () =>
      rows
        .filter((row) => selectedIds.includes(row.id))
        .map((row) => ({ id: row.id, company: row.company })),
    [rows, selectedIds],
  );

  const handleTransferFinished = useCallback((okIds: string[], failedIds: string[]) => {
    if (okIds.length === 0 && failedIds.length === 0) return;
    setSelectedIds(failedIds);
    setReloadToken((token) => token + 1);
  }, []);

  const isEmpty = status === 'ready' && rows.length === 0;

  return (
    <div className="workbench">
      <header className="workbench__head">
        <div>
          <p className="workbench__crumb">业务员工作台 / 线索</p>
          <h1 className="workbench__title">线索列表</h1>
        </div>
        <div className="workbench__side">
          <span className="role-badge" data-testid="role-badge">
            {matrix.role === 'advisor' ? '顾问视角' : '主管视角'}
          </span>
          <span className="muted">{info ? info.name : '未登录'}</span>
          {SHOW_DEMO_CONTROLS && (
            <span className="demo-controls">
              <Select
                size="small"
                style={{ width: 132 }}
                value={info?.role ?? 'advisor'}
                options={[
                  { label: '顾问视角', value: 'advisor' },
                  { label: '主管视角', value: 'supervisor' },
                ]}
                onChange={(value) => setDemoRole(value as RoleName)}
              />
              <Button
                size="small"
                variant="outline"
                onClick={() => {
                  setMockFailure(true);
                  window.location.reload();
                }}
              >
                模拟接口错误
              </Button>
            </span>
          )}
        </div>
      </header>

      {sessionError && <p className="banner banner--warn">{sessionError}</p>}

      <FilterBar filters={filters} matrix={matrix} advisors={advisors} onChange={handleFilterChange} />

      {segments.length > 0 && (
        <p className="active-filters" data-testid="active-filters">
          当前筛选：{segments.join(' · ')}
        </p>
      )}

      <div className="toolbar">
        <div className="toolbar__info">
          <span data-testid="leads-total">共 {total} 条线索</span>
          {selectedIds.length > 0 && (
            <span className="toolbar__selected" data-testid="selected-count">
              已选 {selectedIds.length} 条
            </span>
          )}
        </div>
        <div className="toolbar__actions">
          {matrix.showBulkTransfer && (
            <Button
              theme="primary"
              disabled={selectedIds.length === 0}
              onClick={() => setTransferVisible(true)}
            >
              批量转派
            </Button>
          )}
        </div>
      </div>

      <section className="card">
        {status === 'error' ? (
          <ErrorState message={errorText} onRetry={() => setReloadToken((token) => token + 1)} />
        ) : status === 'loading' && rows.length === 0 ? (
          <TableSkeleton />
        ) : (
          <LeadsTable
            rows={rows}
            matrix={matrix}
            loading={status === 'loading'}
            sort={filters.sort}
            selectedIds={selectedIds}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            onSortChange={handleSortChange}
            empty={<EmptyState onReset={resetFilters} />}
          />
        )}
      </section>

      {!isEmpty && status !== 'error' && (
        <div className="pager">
          <Pagination
            total={total}
            current={filters.page}
            pageSize={filters.size}
            pageSizeOptions={[20, 50, 100]}
            showJumper
            onChange={(pageInfo: { current: number; pageSize: number }) => {
              handleFilterChange({
                page: pageInfo.current,
                size: pageInfo.pageSize as PageSize,
              });
            }}
          />
        </div>
      )}

      {matrix.showBulkTransfer && (
        <BulkTransferDialog
          visible={transferVisible}
          targets={transferTargets}
          onClose={() => setTransferVisible(false)}
          onFinished={handleTransferFinished}
        />
      )}
    </div>
  );
}
