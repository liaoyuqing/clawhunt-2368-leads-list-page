import { useEffect, useState } from 'react';
import { DateRangePicker, Input, Select, Switch } from 'tdesign-react';
import type { Advisor, Channel, SpaceType, Stage } from '../../../api/types';
import {
  CHANNEL_OPTIONS,
  SPACE_TYPE_OPTIONS,
  STAGE_OPTIONS,
  type LeadFilters,
} from '../../../features/sales/leads/filters';
import type { RoleMatrix } from '../../../features/sales/leads/roleMatrix';

interface FilterBarProps {
  filters: LeadFilters;
  matrix: RoleMatrix;
  advisors: Advisor[];
  onChange: (patch: Partial<LeadFilters>, mode?: 'push' | 'replace') => void;
}

type DateLike = string | number | Date;

function toDayString(value: DateLike | undefined | null): string {
  if (value === undefined || value === null || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

export default function FilterBar({ filters, matrix, advisors, onChange }: FilterBarProps) {
  const [keywordDraft, setKeywordDraft] = useState(filters.keyword);

  useEffect(() => {
    setKeywordDraft(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    if (keywordDraft === filters.keyword) return;
    const timer = window.setTimeout(() => {
      onChange({ keyword: keywordDraft }, 'replace');
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keywordDraft, filters.keyword, onChange]);

  const reportedRange = [filters.reportedFrom, filters.reportedTo].filter(Boolean);
  const followedRange = [filters.followedFrom, filters.followedTo].filter(Boolean);

  return (
    <section className="filters" aria-label="线索筛选">
      <div className="filters__row">
        <div className="field field--stage" data-testid="filter-stage">
          <label className="field__label">阶段</label>
          <Select
            multiple
            clearable
            value={filters.stages}
            options={STAGE_OPTIONS}
            placeholder="全部阶段"
            onChange={(value) => {
              const list = Array.isArray(value) ? value : [value];
              onChange({ stages: list as Stage[] });
            }}
          />
        </div>
        <div className="field field--channel" data-testid="filter-channel">
          <label className="field__label">来源渠道</label>
          <Select
            clearable
            value={filters.channel}
            options={CHANNEL_OPTIONS}
            placeholder="全部渠道"
            onChange={(value) => onChange({ channel: (value as Channel) ?? '' })}
          />
        </div>
        <div className="field field--space" data-testid="filter-space-type">
          <label className="field__label">意向空间类型</label>
          <Select
            clearable
            value={filters.spaceType}
            options={SPACE_TYPE_OPTIONS}
            placeholder="全部类型"
            onChange={(value) => onChange({ spaceType: (value as SpaceType) ?? '' })}
          />
        </div>
        {matrix.showOwnerFilter && (
          <div className="field field--owner" data-testid="filter-owner">
            <label className="field__label">负责人</label>
            <Select
              clearable
              filterable
              value={filters.ownerId}
              options={advisors.map((advisor) => ({ label: advisor.name, value: advisor.id }))}
              placeholder="全部负责人"
              onChange={(value) => onChange({ ownerId: (value as string) ?? '' })}
            />
          </div>
        )}
        <div className="field field--recycle" data-testid="filter-recycle">
          <label className="field__label">即将回收</label>
          <div className="field__switch">
            <Switch
              value={filters.recycleSoon}
              onChange={(value) => onChange({ recycleSoon: Boolean(value) })}
            />
            <span className="muted">3 天内</span>
          </div>
        </div>
        <div className="field field--keyword">
          <label className="field__label">关键词</label>
          <Input
            clearable
            value={keywordDraft}
            placeholder="企业名 / 联系人"
            onChange={(value) => setKeywordDraft(String(value ?? ''))}
          />
        </div>
      </div>
      <div className="filters__row filters__row--dates">
        <div className="field field--date">
          <label className="field__label">报备时间区间</label>
          <DateRangePicker
            clearable
            value={reportedRange}
            placeholder={['开始日期', '结束日期']}
            onChange={(value: DateLike[]) => {
              const [from, to] = value ?? [];
              onChange({ reportedFrom: toDayString(from), reportedTo: toDayString(to) });
            }}
          />
        </div>
        <div className="field field--date">
          <label className="field__label">最近跟进时间区间</label>
          <DateRangePicker
            clearable
            value={followedRange}
            placeholder={['开始日期', '结束日期']}
            onChange={(value: DateLike[]) => {
              const [from, to] = value ?? [];
              onChange({ followedFrom: toDayString(from), followedTo: toDayString(to) });
            }}
          />
        </div>
      </div>
    </section>
  );
}
