import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

/** 在指定 URL query 下渲染整个页面：筛选状态的唯一来源就是地址栏 */
export function renderAt(search: string) {
  const normalized = search && !search.startsWith('?') ? '?' + search : search;
  window.history.replaceState(null, '', '/' + (normalized ?? ''));
  return render(<App />);
}

export async function waitForRole(label: '顾问视角' | '主管视角'): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId('role-badge')).toHaveTextContent(label);
  });
}

export async function waitForRows(): Promise<void> {
  await waitFor(() => {
    expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
  });
}

export async function waitForTotal(expected: number): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId('leads-total')).toHaveTextContent('共 ' + expected + ' 条线索');
  });
}
