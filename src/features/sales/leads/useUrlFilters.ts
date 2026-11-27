import { useCallback, useEffect, useMemo, useState } from 'react';
import { type LeadFilters, parseQuery, toQuery } from './filters';

function readSearch(): string {
  if (typeof window === 'undefined') return '';
  return window.location.search;
}

export interface UrlFiltersApi {
  filters: LeadFilters;
  /** 离散变更（下拉、开关、分页）：push 一条历史，支持浏览器后退 */
  push: (next: LeadFilters) => void;
  /** 连续变更（关键词输入）：replace 掉当前历史项，避免一次输入刷出十几条 */
  replace: (next: LeadFilters) => void;
}

/** 筛选状态的唯一来源是 URL：组件不额外维护 state 副本，刷新后自然还原 */
export function useUrlFilters(): UrlFiltersApi {
  const [search, setSearch] = useState<string>(readSearch);

  useEffect(() => {
    const onPopState = () => setSearch(readSearch());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const filters = useMemo(() => parseQuery(search), [search]);

  const write = useCallback((next: LeadFilters, mode: 'push' | 'replace') => {
    const queryString = toQuery(next);
    const target = window.location.pathname + queryString;
    if (mode === 'push') window.history.pushState(null, '', target);
    else window.history.replaceState(null, '', target);
    setSearch(window.location.search);
  }, []);

  const push = useCallback((next: LeadFilters) => write(next, 'push'), [write]);
  const replace = useCallback((next: LeadFilters) => write(next, 'replace'), [write]);

  return { filters, push, replace };
}
