export interface ApiHit {
  method: string;
  path: string;
  params: URLSearchParams;
}

/** 只依赖 msw 的 events 通道，避免绑定具体 server 实现类型 */
export interface RequestEmitter {
  events: {
    on: (event: 'request:start', listener: (args: { request: Request }) => void) => void;
  };
}

/** 记录组件真实发出的请求，断言「筛选条件进了请求参数」而不是只断言界面文字 */
export function captureApi(server: RequestEmitter): ApiHit[] {
  const hits: ApiHit[] = [];
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url);
    hits.push({ method: request.method, path: url.pathname, params: url.searchParams });
  });
  return hits;
}

export function hitsFor(hits: ApiHit[], path: string): ApiHit[] {
  return hits.filter((hit) => hit.path === path);
}

export function lastHit(hits: ApiHit[], path: string): ApiHit {
  const list = hitsFor(hits, path);
  if (list.length === 0) throw new Error('没有对 ' + path + ' 的请求');
  return list[list.length - 1];
}
