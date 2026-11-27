import type { Channel, SpaceType, Stage } from '../../../api/types';

export const STAGE_OPTIONS: Array<{ value: Stage; label: string }> = [
  { value: 'public_pool', label: '公海' },
  { value: 'new', label: '新线索' },
  { value: 'contacted', label: '已联系' },
  { value: 'qualified', label: '已确认' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'contract', label: '已签约' },
];

export const CHANNEL_OPTIONS: Array<{ value: Channel; label: string }> = [
  { value: 'referral', label: '老客户转介' },
  { value: 'website', label: '官网表单' },
  { value: 'exhibition', label: '行业展会' },
  { value: 'partner', label: '合作伙伴' },
];

export const SPACE_TYPE_OPTIONS: Array<{ value: SpaceType; label: string }> = [
  { value: 'office', label: '独立办公室' },
  { value: 'workstation', label: '共享工位' },
  { value: 'suite', label: '整层套间' },
];

export const PAGE_SIZES = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export type SortKey = 'reportedAt:desc' | 'reportedAt:asc' | 'followedAt:desc' | 'followedAt:asc';
export const SORT_KEYS: SortKey[] = ['reportedAt:desc', 'reportedAt:asc', 'followedAt:desc', 'followedAt:asc'];

export interface LeadFilters {
  stages: Stage[];
  channel: Channel | '';
  spaceType: SpaceType | '';
  reportedFrom: string;
  reportedTo: string;
  followedFrom: string;
  followedTo: string;
  recycleSoon: boolean;
  keyword: string;
  ownerId: string;
  sort: SortKey;
  page: number;
  size: PageSize;
}

export const DEFAULT_FILTERS: LeadFilters = {
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
  sort: 'reportedAt:desc',
  page: 1,
  size: 20,
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STAGE_VALUES = STAGE_OPTIONS.map((item) => item.value);
const CHANNEL_VALUES = CHANNEL_OPTIONS.map((item) => item.value);
const SPACE_TYPE_VALUES = SPACE_TYPE_OPTIONS.map((item) => item.value);

function asDate(value: string | null): string {
  if (!value) return '';
  return DATE_RE.test(value) ? value : '';
}

function asPageSize(value: string | null): PageSize {
  const num = Number(value);
  return PAGE_SIZES.includes(num as PageSize) ? (num as PageSize) : 20;
}

/** URL query -> 筛选状态：非法值忽略并回落默认，绝不抛错（避免分享到坏链接就白屏） */
export function parseQuery(search: string): LeadFilters {
  const query = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rawStages = (query.get('stage') ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const stages = STAGE_VALUES.filter((value) => rawStages.includes(value));
  const rawChannel = query.get('source') ?? '';
  const rawSpaceType = query.get('spaceType') ?? '';
  const rawSort = (query.get('sort') ?? '') as SortKey;
  const rawPage = Number(query.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  return {
    stages,
    channel: (CHANNEL_VALUES as string[]).includes(rawChannel) ? (rawChannel as Channel) : '',
    spaceType: (SPACE_TYPE_VALUES as string[]).includes(rawSpaceType) ? (rawSpaceType as SpaceType) : '',
    reportedFrom: asDate(query.get('reportedFrom')),
    reportedTo: asDate(query.get('reportedTo')),
    followedFrom: asDate(query.get('followedFrom')),
    followedTo: asDate(query.get('followedTo')),
    recycleSoon: query.get('recycle') === 'soon',
    keyword: (query.get('keyword') ?? '').trim(),
    ownerId: query.get('owner') ?? '',
    sort: SORT_KEYS.includes(rawSort) ? rawSort : DEFAULT_FILTERS.sort,
    page,
    size: asPageSize(query.get('size')),
  };
}

function encodeValue(value: string): string {
  return encodeURIComponent(value).replace(/%20/g, '+');
}

/** 筛选状态 -> URL query：默认值不写进地址栏，多选阶段用逗号保持可读 */
export function toQuery(filters: LeadFilters): string {
  const parts: string[] = [];
  const add = (key: string, value: string) => {
    parts.push(key + '=' + encodeValue(value));
  };
  if (filters.stages.length) {
    parts.push('stage=' + filters.stages.map(encodeValue).join(','));
  }
  if (filters.channel) add('source', filters.channel);
  if (filters.spaceType) add('spaceType', filters.spaceType);
  if (filters.reportedFrom) add('reportedFrom', filters.reportedFrom);
  if (filters.reportedTo) add('reportedTo', filters.reportedTo);
  if (filters.followedFrom) add('followedFrom', filters.followedFrom);
  if (filters.followedTo) add('followedTo', filters.followedTo);
  if (filters.recycleSoon) add('recycle', 'soon');
  if (filters.keyword.trim()) add('keyword', filters.keyword.trim());
  if (filters.ownerId) add('owner', filters.ownerId);
  if (filters.sort !== DEFAULT_FILTERS.sort) add('sort', filters.sort);
  if (filters.page > 1) add('page', String(filters.page));
  if (filters.size !== DEFAULT_FILTERS.size) add('size', String(filters.size));
  return parts.length ? '?' + parts.join('&') : '';
}

/** 筛选状态 -> 后端参数（GET /api/sales/leads 的对接点，字段名见 README） */
export function toApiParams(filters: LeadFilters): Record<string, string> {
  const params: Record<string, string> = {};
  if (filters.stages.length) params.stage = filters.stages.join(',');
  if (filters.channel) params.source = filters.channel;
  if (filters.spaceType) params.space_type = filters.spaceType;
  if (filters.reportedFrom) params.reported_from = filters.reportedFrom;
  if (filters.reportedTo) params.reported_to = filters.reportedTo;
  if (filters.followedFrom) params.followed_from = filters.followedFrom;
  if (filters.followedTo) params.followed_to = filters.followedTo;
  if (filters.recycleSoon) params.recycle = 'soon';
  if (filters.keyword.trim()) params.keyword = filters.keyword.trim();
  if (filters.ownerId) params.owner_id = filters.ownerId;
  params.sort = filters.sort;
  params.page = String(filters.page);
  params.size = String(filters.size);
  return params;
}
