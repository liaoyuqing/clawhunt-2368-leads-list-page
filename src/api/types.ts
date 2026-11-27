/** 接口契约（GET /api/sales/leads 未就绪，先用 MSW mock；对接点见 README） */

export type Stage = 'public_pool' | 'new' | 'contacted' | 'qualified' | 'negotiating' | 'contract';

export type Channel = 'referral' | 'website' | 'exhibition' | 'partner';

export type SpaceType = 'office' | 'workstation' | 'suite';

export type RoleName = 'advisor' | 'supervisor' | 'manager';

export interface LeadRow {
  id: string;
  company: string;
  contact: string;
  industry: string;
  channel: Channel;
  spaceType: SpaceType;
  stage: Stage;
  siteId: string;
  reportedAt: string;
  followedAt: string | null;
  recycleAt: string | null;
  /** 距回收天数由服务端按 server_date 计算，公海与合同及以后为 null */
  daysLeft: number | null;
  ownerId: string | null;
  ownerName: string | null;
  workstations: number;
}

export interface LeadListResponse {
  items: LeadRow[];
  total: number;
  page: number;
  size: number;
  serverDate: string;
}

export interface Advisor {
  id: string;
  name: string;
  siteIds: string[];
}

export interface SessionInfo {
  id: string;
  name: string;
  role: RoleName;
}

export interface TransferSuccess {
  id: string;
  ownerId: string;
  ownerName: string;
}

export interface ApiErrorBody {
  code: string;
  message: string;
}
