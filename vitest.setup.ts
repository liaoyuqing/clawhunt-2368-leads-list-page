import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './src/mocks/node';

// Node 22.4+ 自带一个实验性的全局 localStorage（没传 --localstorage-file 时读出来是 undefined），
// 它会遮蔽 jsdom 注入的实现。低版本 Node 上这段是空操作，把 jsdom 自己的 Storage 回填回去即可。
const jsdomWindow = window as unknown as { _localStorage?: Storage };
if (!window.localStorage && jsdomWindow._localStorage) {
  Object.defineProperty(window, 'localStorage', {
    value: jsdomWindow._localStorage,
    configurable: true,
    writable: true,
    enumerable: true,
  });
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  window.localStorage.clear();
  window.history.replaceState(null, '', '/');
});

afterAll(() => {
  server.close();
});
