import { useCallback, useEffect, useState } from 'react';
import { leadsApi } from '../../../api/client';
import type { RoleName, SessionInfo } from '../../../api/types';
import { writeDemoRole } from './demoSession';

export interface SessionState {
  info: SessionInfo | null;
  loading: boolean;
  error: string;
  reload: () => void;
  setDemoRole: (role: RoleName) => void;
}

export function useSession(): SessionState {
  const [info, setInfo] = useState<SessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [token, setToken] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    leadsApi
      .fetchSession()
      .then((session) => {
        if (!alive) return;
        setInfo(session);
        setError('');
      })
      .catch(() => {
        if (!alive) return;
        setError('身份信息加载失败，按只读顾问视角展示');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  const reload = useCallback(() => setToken((value) => value + 1), []);

  const setDemoRole = useCallback((role: RoleName) => {
    writeDemoRole(role);
    setToken((value) => value + 1);
  }, []);

  return { info, loading, error, reload, setDemoRole };
}
