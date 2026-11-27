import { HttpResponse, delay, http } from 'msw';
import type { Advisor, LeadRow, SessionInfo } from '../api/types';
import { isMockFailureOn, readDemoRole } from '../features/sales/leads/demoSession';
import {
  ADVISORS,
  LEADS,
  SERVER_DATE,
  SUPERVISOR,
  TRANSFER_CONFLICT_ID,
  TRANSFER_FORBIDDEN_ID,
} from './leads';

/** 浏览器里给一点延迟，让加载态可见；测试里为 0，避免拖慢用例 */
const LATENCY = import.meta.env.MODE === 'test' ? 0 : 220;

export const RECYCLE_SOON_DAYS = 3;

function readRole(): SessionInfo['role'] {
  return readDemoRole();
}

function failFlagOn(): boolean {
  return isMockFailureOn();
}

export function daysLeftOf(recycleAt: string | null, serverDate: string = SERVER_DATE): number | null {
  if (!recycleAt) return null;
  const target = Date.parse(recycleAt.slice(0, 10) + 'T00:00:00Z');
  const base = Date.parse(serverDate + 'T00:00:00Z');
  return Math.round((target - base) / 86400000);
}

function withDaysLeft(row: LeadRow): LeadRow {
  return { ...row, daysLeft: daysLeftOf(row.recycleAt) };
}

const store: LeadRow[] = LEADS.map(withDaysLeft);

function matchKeyword(row: LeadRow, keyword: string): boolean {
  if (!keyword) return true;
  const k = keyword.trim().toLowerCase();
  if (!k) return true;
  return row.company.toLowerCase().includes(k) || row.contact.toLowerCase().includes(k);
}

function datePart(value: string | null): string {
  return value ? value.slice(0, 10) : '';
}

function inRange(value: string | null, from: string, to: string): boolean {
  if (!from && !to) return true;
  const day = datePart(value);
  if (!day) return false;
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

function sortRows(rows: LeadRow[], sort: string): LeadRow[] {
  const [field, direction] = sort.split(':');
  const key: 'reportedAt' | 'followedAt' = field === 'followedAt' ? 'followedAt' : 'reportedAt';
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === bv) return a.id < b.id ? -1 : 1;
    if (av === null) return 1;
    if (bv === null) return -1;
    return av < bv ? -factor : factor;
  });
}

export const handlers = [
  http.get('/api/me', async () => {
    if (LATENCY) await delay(LATENCY);
    const role = readRole();
    const isSupervisor = role === 'supervisor' || role === 'manager';
    const info: SessionInfo = isSupervisor
      ? { id: SUPERVISOR.id, name: SUPERVISOR.name, role }
      : { id: ADVISORS[0].id, name: ADVISORS[0].name, role };
    return HttpResponse.json(info);
  }),

  http.get('/api/users', async ({ request }) => {
    if (LATENCY) await delay(LATENCY);
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const list: Advisor[] = role === 'advisor' ? ADVISORS : [SUPERVISOR, ...ADVISORS];
    return HttpResponse.json(list);
  }),

  http.get('/api/sales/leads', async ({ request }) => {
    if (LATENCY) await delay(LATENCY);
    if (failFlagOn()) {
      return HttpResponse.json(
        { code: 'LEADS_UPSTREAM_UNAVAILABLE', message: '线索服务暂时不可用，请稍后重试' },
        { status: 503 },
      );
    }
    const url = new URL(request.url);
    const q = url.searchParams;
    const stages = (q.get('stage') ?? '').split(',').filter(Boolean);
    const source = q.get('source') ?? '';
    const spaceType = q.get('space_type') ?? '';
    const ownerId = q.get('owner_id') ?? '';
    const keyword = q.get('keyword') ?? '';
    const recycleSoon = q.get('recycle') === 'soon';
    const reportedFrom = q.get('reported_from') ?? '';
    const reportedTo = q.get('reported_to') ?? '';
    const followedFrom = q.get('followed_from') ?? '';
    const followedTo = q.get('followed_to') ?? '';
    const sort = q.get('sort') ?? 'reportedAt:desc';
    const page = Math.max(1, Number(q.get('page') ?? 1) || 1);
    const size = Math.max(1, Number(q.get('size') ?? 20) || 20);

    const filtered = store.filter((row) => {
      if (stages.length && !stages.includes(row.stage)) return false;
      if (source && row.channel !== source) return false;
      if (spaceType && row.spaceType !== spaceType) return false;
      if (ownerId && row.ownerId !== ownerId) return false;
      if (recycleSoon && (row.daysLeft === null || row.daysLeft > RECYCLE_SOON_DAYS || row.daysLeft < 0)) return false;
      if (!matchKeyword(row, keyword)) return false;
      if (!inRange(row.reportedAt, reportedFrom, reportedTo)) return false;
      if (!inRange(row.followedAt, followedFrom, followedTo)) return false;
      return true;
    });

    const sorted = sortRows(filtered, sort);
    const start = (page - 1) * size;
    return HttpResponse.json({
      items: sorted.slice(start, start + size),
      total: sorted.length,
      page,
      size,
      serverDate: SERVER_DATE,
    });
  }),

  http.patch('/api/sales/leads/:id/owner', async ({ params, request }) => {
    if (LATENCY) await delay(LATENCY);
    const id = String(params.id);
    const body = (await request.json()) as { ownerId?: string };
    const target = ADVISORS.find((a) => a.id === body.ownerId);
    if (!target) {
      return HttpResponse.json({ code: 'OWNER_NOT_FOUND', message: '目标顾问不存在' }, { status: 404 });
    }
    if (id === TRANSFER_CONFLICT_ID) {
      return HttpResponse.json({ code: 'LEAD_ALREADY_TRANSFERRED', message: '该线索已被他人转派' }, { status: 409 });
    }
    if (id === TRANSFER_FORBIDDEN_ID) {
      return HttpResponse.json({ code: 'OWNER_SCOPE_DENIED', message: '目标顾问无该会所权限' }, { status: 403 });
    }
    const row = store.find((item) => item.id === id);
    if (!row) {
      return HttpResponse.json({ code: 'LEAD_NOT_FOUND', message: '线索不存在或已回收' }, { status: 404 });
    }
    row.ownerId = target.id;
    row.ownerName = target.name;
    return HttpResponse.json({ id: row.id, ownerId: target.id, ownerName: target.name });
  }),
];
