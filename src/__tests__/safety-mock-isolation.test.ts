import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { MOCK_SERVER_DATE } from '../mocks/config';
import { SERVER_DATE } from '../mocks/leads';

const SRC = resolve(__dirname, '..');

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe('mock 层与生产代码的隔离', () => {
  it('safety-mock-isolation: 生产代码（src/api、src/pages、src/components、src/features）不引用 src/mocks', () => {
    const productionDirs = ['api', 'pages', 'components', 'features'].map((name) => join(SRC, name));
    const offenders: string[] = [];
    for (const dir of productionDirs) {
      for (const file of collectFiles(dir)) {
        const text = readFileSync(file, 'utf8');
        if (/from '[^']*mocks\//.test(text)) offenders.push(file.replace(SRC, 'src'));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('safety-mock-isolation: 基准日来自 mock 时钟配置，随运行当天或 VITE_MOCK_DATE 变化，而非业务代码里写死', () => {
    expect(SERVER_DATE).toBe(MOCK_SERVER_DATE);
    expect(MOCK_SERVER_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const config = readFileSync(join(SRC, 'mocks', 'config.ts'), 'utf8');
    expect(config).toContain('VITE_MOCK_DATE');
    // 时钟只在 mock 层解析，生产代码里不出现日期常量
    const prodFiles = ['api', 'pages', 'components', 'features'].flatMap((name) => collectFiles(join(SRC, name)));
    const pinned = prodFiles.filter((file) => readFileSync(file, 'utf8').includes('VITE_MOCK_DATE'));
    expect(pinned).toEqual([]);
  });

  it('safety-mock-isolation: mock 时钟可被 VITE_MOCK_DATE 钉住（倒计时口径随之平移）', () => {
    const configPath = resolve(SRC, 'mocks', 'config.ts');
    const text = readFileSync(configPath, 'utf8');
    expect(text).toContain('ISO_DATE.test(pinned)');
    expect(text).toContain('resolveMockNow');
    expect(dirname(configPath)).toBe(join(SRC, 'mocks'));
  });
});
