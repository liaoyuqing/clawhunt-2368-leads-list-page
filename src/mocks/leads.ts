import type { Advisor, Channel, LeadRow, SpaceType, Stage } from '../api/types';
import { MOCK_NOW, MOCK_SERVER_DATE } from './config';

/** 服务端基准日（由 mock 时钟得出，可用 VITE_MOCK_DATE 钉住） */
export const SERVER_DATE = MOCK_SERVER_DATE;

export const SUPERVISOR: Advisor = { id: 'u-9001', name: '罗清晏', siteIds: ['S-01', 'S-02', 'S-03'] };

export const ADVISORS: Advisor[] = [
  { id: 'u-1001', name: '陈嘉禾', siteIds: ['S-01', 'S-02'] },
  { id: 'u-1002', name: '林疏桐', siteIds: ['S-01', 'S-03'] },
  { id: 'u-1003', name: '周牧野', siteIds: ['S-02', 'S-03'] },
  { id: 'u-1004', name: '苏含章', siteIds: ['S-01', 'S-02', 'S-03'] },
  { id: 'u-1005', name: '郑伯言', siteIds: ['S-01'] },
  { id: 'u-1006', name: '何知微', siteIds: ['S-02', 'S-03'] },
];

const CONTACTS = ['王砚', '李澜', '周予', '孙澈', '吴桐', '郑禾', '冯岸', '陈屿', '沈禾', '许朝', '罗笙', '高岑'];
const SITE_IDS = ['S-01', 'S-02', 'S-03'];

type RowSpec = [string, string, Channel, SpaceType, Stage, number | null];

const SPEC: RowSpec[] = [
  ['星屿数字科技', '软件与信息服务', 'referral', 'office', 'qualified', 1],
  ['衡川智能装备', '智能制造', 'website', 'workstation', 'qualified', 2],
  ['青禾品牌管理', '品牌与营销', 'exhibition', 'suite', 'qualified', 3],
  ['澜途供应链', '供应链与物流', 'partner', 'office', 'qualified', 4],
  ['北辰数据实验室', '建筑设计', 'referral', 'workstation', 'qualified', 0],
  ['云栖建筑事务所', '医疗健康', 'website', 'suite', 'negotiating', 10],
  ['澄明医疗科技', '文旅与会展', 'exhibition', 'office', 'negotiating', 17],
  ['远岫文旅集团', '新能源与材料', 'partner', 'workstation', 'negotiating', 24],
  ['沐辰新材料', '软件与信息服务', 'referral', 'suite', 'qualified', 4],
  ['栖岸文化传媒', '智能制造', 'website', 'office', 'qualified', 11],
  ['邻湖餐饮管理', '品牌与营销', 'exhibition', 'workstation', 'contacted', 18],
  ['弘毅教育咨询', '供应链与物流', 'partner', 'suite', 'contacted', 25],
  ['元朔半导体', '建筑设计', 'referral', 'office', 'qualified', 5],
  ['承影视觉设计', '医疗健康', 'website', 'workstation', 'negotiating', 12],
  ['沐野农业科技', '文旅与会展', 'exhibition', 'suite', 'contacted', 19],
  ['拾光影视制作', '新能源与材料', 'partner', 'office', 'qualified', 26],
  ['启岭新能源', '软件与信息服务', 'referral', 'workstation', 'new', 6],
  ['澜声音频科技', '智能制造', 'website', 'suite', 'new', 13],
  ['亦舟物流科技', '品牌与营销', 'exhibition', 'office', 'contacted', 20],
  ['明澈环保工程', '供应链与物流', 'partner', 'workstation', 'qualified', 27],
  ['广屿国际贸易', '建筑设计', 'referral', 'suite', 'new', 7],
  ['匠心家居设计', '医疗健康', 'website', 'office', 'new', 14],
  ['星弧机器人', '文旅与会展', 'exhibition', 'workstation', 'contacted', 21],
  ['沐光照明工程', '新能源与材料', 'partner', 'suite', 'qualified', 28],
  ['松风茶业', '软件与信息服务', 'referral', 'office', 'negotiating', 8],
  ['予安健康管理', '智能制造', 'website', 'workstation', 'new', 15],
  ['双栖生物医药', '品牌与营销', 'exhibition', 'suite', 'new', 22],
  ['长川精密仪器', '供应链与物流', 'partner', 'office', 'contacted', 2],
  ['岸芷广告', '建筑设计', 'referral', 'workstation', 'qualified', 9],
  ['溯光影像', '医疗健康', 'website', 'suite', 'negotiating', 16],
  ['觉岸城市规划', '文旅与会展', 'exhibition', 'office', 'new', 23],
  ['木白空间设计', '新能源与材料', 'partner', 'workstation', 'new', 3],
  ['知微法律科技', '软件与信息服务', 'referral', 'suite', 'contacted', 10],
  ['千帆跨境服务', '智能制造', 'website', 'office', 'qualified', 17],
  ['绿汀园林', '品牌与营销', 'exhibition', 'workstation', 'new', 24],
  ['一苇数据服务', '供应链与物流', 'partner', 'suite', 'contacted', 4],
  ['澄海纺织', '建筑设计', 'referral', 'office', 'public_pool', null],
  ['白鹭教育科技', '医疗健康', 'website', 'workstation', 'public_pool', null],
  ['岑岭体育文化', '文旅与会展', 'exhibition', 'suite', 'public_pool', null],
  ['融川融资租赁', '新能源与材料', 'partner', 'office', 'public_pool', null],
  ['品汇食品', '软件与信息服务', 'referral', 'workstation', 'public_pool', null],
  ['亦禾美容连锁', '智能制造', 'website', 'suite', 'public_pool', null],
  ['湾流航空服务', '品牌与营销', 'exhibition', 'office', 'public_pool', null],
  ['山与海户外', '供应链与物流', 'partner', 'workstation', 'public_pool', null],
  ['拾贝宠物医疗', '建筑设计', 'referral', 'suite', 'contract', null],
  ['半夏健康食品', '医疗健康', 'website', 'office', 'contract', null],
  ['沐禾母婴服务', '文旅与会展', 'exhibition', 'workstation', 'contract', null],
  ['少陵文化传播', '新能源与材料', 'partner', 'suite', 'contract', null],
  ['云阶软件', '软件与信息服务', 'referral', 'office', 'contract', null],
  ['洞天信息安全', '智能制造', 'website', 'workstation', 'contract', null],
  ['星野研学', '品牌与营销', 'exhibition', 'suite', 'contract', null],
  ['归禾冷链', '供应链与物流', 'partner', 'office', 'contract', null],
  ['沐川饮品', '建筑设计', 'referral', 'workstation', 'qualified', 15],
  ['元启半导体材料', '医疗健康', 'website', 'suite', 'negotiating', 22],
  ['知白建筑设计', '文旅与会展', 'exhibition', 'office', 'qualified', 2],
  ['半坡艺术空间', '新能源与材料', 'partner', 'workstation', 'contacted', 9],
  ['澜桥投顾', '软件与信息服务', 'referral', 'suite', 'negotiating', 16],
  ['岑川机械', '智能制造', 'website', 'office', 'qualified', 23],
  ['禾光新能源', '品牌与营销', 'exhibition', 'workstation', 'new', 3],
  ['佑宁养老服务', '供应链与物流', 'partner', 'suite', 'contacted', 10],
  ['思屿职业教育', '建筑设计', 'referral', 'office', 'qualified', 17],
  ['简川包装', '医疗健康', 'website', 'workstation', 'negotiating', 24],
  ['落霞酒店管理', '文旅与会展', 'exhibition', 'suite', 'new', 4],
  ['朴野园林工程', '新能源与材料', 'partner', 'office', 'qualified', 11],
  ['星原检测', '软件与信息服务', 'referral', 'workstation', 'contacted', 18],
  ['望舒文创', '智能制造', 'website', 'suite', 'negotiating', 25],
  ['屿见旅游', '品牌与营销', 'exhibition', 'office', 'qualified', 5],
  ['沧澜海洋科技', '供应链与物流', 'partner', 'workstation', 'new', 12],
];

function isoAt(daysAgo: number, hour: number, minute: number): string {
  const base = new Date(MOCK_NOW.getTime());
  base.setDate(base.getDate() - daysAgo);
  base.setHours(hour, minute, 0, 0);
  return base.toISOString();
}

function isoRecycle(daysLeft: number): string {
  const base = new Date(MOCK_NOW.getTime());
  base.setDate(base.getDate() + daysLeft);
  base.setHours(23, 59, 0, 0);
  return base.toISOString();
}

function buildLeads(): LeadRow[] {
  return SPEC.map((spec, i) => {
    const [company, industry, channel, spaceType, stage, daysLeft] = spec;
    const hasCountdown = daysLeft !== null;
    const owner = stage === 'public_pool' ? null : ADVISORS[i % ADVISORS.length];
    const followedGap = 1 + (i % 4);
    const followedDaysAgo = Math.max(0, i + 1 - followedGap);
    return {
      id: 'L-' + String(i + 1).padStart(4, '0'),
      company,
      contact: CONTACTS[i % CONTACTS.length],
      industry,
      channel,
      spaceType,
      stage,
      siteId: SITE_IDS[i % SITE_IDS.length],
      reportedAt: isoAt(i + 1, 9 + (i % 8), (i * 7) % 60),
      followedAt: stage === 'new' && i % 3 === 0 ? null : isoAt(followedDaysAgo, 10 + (i % 7), (i * 11) % 60),
      recycleAt: hasCountdown ? isoRecycle(daysLeft as number) : null,
      daysLeft,
      ownerId: owner ? owner.id : null,
      ownerName: owner ? owner.name : null,
      workstations: 4 + ((i * 5) % 40),
    };
  });
}

export const LEADS: LeadRow[] = buildLeads();

/** 两条固定线索用于模拟批量转派的失败分支（409 / 403），便于复现部分失败场景 */
export const TRANSFER_CONFLICT_ID = 'L-0009';
export const TRANSFER_FORBIDDEN_ID = 'L-0014';