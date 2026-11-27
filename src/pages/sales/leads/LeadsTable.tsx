import { useMemo, type ReactNode } from 'react';
import { Table, Tag, type PrimaryTableCol } from 'tdesign-react';
import type { LeadRow, Stage } from '../../../api/types';
import { countdownLevel, formatCountdown } from '../../../features/sales/leads/countdown';
import { CHANNEL_OPTIONS, type SortKey, STAGE_OPTIONS } from '../../../features/sales/leads/filters';
import type { RoleMatrix } from '../../../features/sales/leads/roleMatrix';

const STAGE_THEME: Record<Stage, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  public_pool: 'default',
  new: 'primary',
  contacted: 'primary',
  qualified: 'warning',
  negotiating: 'warning',
  contract: 'success',
};

function stageLabel(stage: Stage): string {
  return STAGE_OPTIONS.find((item) => item.value === stage)?.label ?? stage;
}

function channelLabel(channel: LeadRow['channel']): string {
  return CHANNEL_OPTIONS.find((item) => item.value === channel)?.label ?? channel;
}

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  return value.slice(0, 10) + ' ' + value.slice(11, 16);
}

interface LeadsTableProps {
  rows: LeadRow[];
  matrix: RoleMatrix;
  loading: boolean;
  sort: SortKey;
  selectedIds: string[];
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
  onSortChange: (field: 'reportedAt' | 'followedAt') => void;
  empty: ReactNode;
}

export default function LeadsTable({
  rows,
  matrix,
  loading,
  sort,
  selectedIds,
  onToggleRow,
  onToggleAll,
  onSortChange,
  empty,
}: LeadsTableProps) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const sortTitle = (label: string, field: 'reportedAt' | 'followedAt') => {
    const active = sort.startsWith(field + ':');
    const arrow = active ? (sort.endsWith(':asc') ? '↑' : '↓') : '↕';
    return (
      <button
        type="button"
        className={'sort-btn' + (active ? ' sort-btn--active' : '')}
        aria-label={'按' + label + '排序'}
        onClick={() => onSortChange(field)}
      >
        {label}
        <span className="sort-btn__arrow">{arrow}</span>
      </button>
    );
  };

  const columns = useMemo(() => {
    const list: PrimaryTableCol<LeadRow>[] = [];
    if (matrix.showBulkTransfer) {
      list.push({
        colKey: 'pick',
        width: 56,
        title: (
          <input
            type="checkbox"
            className="pick-input"
            aria-label="选择本页全部"
            checked={allSelected}
            onChange={() => onToggleAll()}
          />
        ),
        cell: ({ row }: { row: LeadRow }) => (
          <input
            type="checkbox"
            className="pick-input"
            aria-label={'选择 ' + row.company}
            checked={selectedIds.includes(row.id)}
            onChange={() => onToggleRow(row.id)}
          />
        ),
      });
    }
    list.push({
      colKey: 'company',
      title: '企业名',
      width: 230,
      cell: ({ row }: { row: LeadRow }) => (
        <div className="cell-company">
          <a className="cell-company__link" href={'/sales/leads/' + row.id}>
            {row.company}
          </a>
          <span className="cell-company__sub">联系人 {row.contact}</span>
        </div>
      ),
    });
    list.push({ colKey: 'industry', title: '行业', width: 140, cell: ({ row }: { row: LeadRow }) => row.industry });
    list.push({
      colKey: 'channel',
      title: '来源',
      width: 120,
      cell: ({ row }: { row: LeadRow }) => channelLabel(row.channel),
    });
    list.push({
      colKey: 'stage',
      title: '阶段',
      width: 110,
      cell: ({ row }: { row: LeadRow }) => (
        <Tag theme={STAGE_THEME[row.stage]} variant="light">
          {stageLabel(row.stage)}
        </Tag>
      ),
    });
    list.push({
      colKey: 'reportedAt',
      title: sortTitle('报备时间', 'reportedAt'),
      width: 160,
      cell: ({ row }: { row: LeadRow }) => formatDateTime(row.reportedAt),
    });
    list.push({
      colKey: 'followedAt',
      title: sortTitle('最近跟进时间', 'followedAt'),
      width: 170,
      cell: ({ row }: { row: LeadRow }) => formatDateTime(row.followedAt),
    });
    list.push({
      colKey: 'daysLeft',
      title: '距回收天数',
      width: 130,
      cell: ({ row }: { row: LeadRow }) => {
        const level = countdownLevel(row.daysLeft, row.stage);
        return (
          <span
            className={'countdown' + (level ? ' countdown--' + level : '')}
            data-level={level ?? 'none'}
            data-testid={'countdown-' + row.id}
          >
            {formatCountdown(row.daysLeft, row.stage)}
          </span>
        );
      },
    });
    if (matrix.showOwnerColumn) {
      list.push({
        colKey: 'ownerName',
        title: '负责人',
        width: 120,
        cell: ({ row }: { row: LeadRow }) => row.ownerName ?? '—',
      });
    }
    list.push({
      colKey: 'workstations',
      title: '意向工位数',
      width: 120,
      cell: ({ row }: { row: LeadRow }) => String(row.workstations),
    });
    return list;
  }, [allSelected, matrix.showBulkTransfer, matrix.showOwnerColumn, onSortChange, onToggleAll, onToggleRow, rows, selectedIds, sort]);

  return (
    <Table<LeadRow>
      rowKey="id"
      data={rows}
      columns={columns}
      loading={loading}
      empty={empty}
      hover
      tableLayout="fixed"
      size="medium"
    />
  );
}
