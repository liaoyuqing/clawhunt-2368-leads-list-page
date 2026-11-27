import { useEffect, useState } from 'react';
import { Button, Dialog } from 'tdesign-react';
import { ApiError, leadsApi } from '../api/client';
import type { Advisor } from '../api/types';

export interface TransferTarget {
  id: string;
  company: string;
}

export interface TransferOutcome extends TransferTarget {
  ok: boolean;
  reason?: string;
}

interface BulkTransferDialogProps {
  visible: boolean;
  targets: TransferTarget[];
  onClose: () => void;
  onFinished: (okIds: string[], failedIds: string[]) => void;
}

export default function BulkTransferDialog({ visible, targets, onClose, onFinished }: BulkTransferDialogProps) {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [advisorError, setAdvisorError] = useState('');
  const [targetOwnerId, setTargetOwnerId] = useState('');
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [outcomes, setOutcomes] = useState<TransferOutcome[]>([]);
  const [ran, setRan] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setAdvisorError('');
    leadsApi
      .fetchAdvisors()
      .then((list) => {
        if (alive) setAdvisors(list);
      })
      .catch(() => {
        if (alive) setAdvisorError('顾问列表加载失败，请关闭弹窗后重试');
      });
    return () => {
      alive = false;
    };
  }, [visible]);

  useEffect(() => {
    if (visible) return;
    setOutcomes([]);
    setRan(false);
    setRunning(false);
    setTargetOwnerId('');
    setProgress({ done: 0, total: 0 });
  }, [visible]);

  async function runTransfer(ids: string[]) {
    if (!targetOwnerId || ids.length === 0) return;
    setRunning(true);
    setProgress({ done: 0, total: ids.length });
    const collected: TransferOutcome[] = [];
    for (let index = 0; index < ids.length; index += 1) {
      const id = ids[index];
      const target = targets.find((item) => item.id === id);
      const company = target ? target.company : id;
      try {
        await leadsApi.transferLead(id, targetOwnerId);
        collected.push({ id, company, ok: true });
      } catch (error) {
        const reason =
          error instanceof ApiError ? error.message : '网络异常：请求超时或连接中断';
        collected.push({ id, company, ok: false, reason });
      }
      setProgress({ done: index + 1, total: ids.length });
    }
    setOutcomes((previous) => {
      const merged = new Map(previous.map((item) => [item.id, item]));
      collected.forEach((item) => merged.set(item.id, item));
      return Array.from(merged.values());
    });
    setRan(true);
    setRunning(false);
  }

  const okCount = outcomes.filter((item) => item.ok).length;
  const failed = outcomes.filter((item) => !item.ok);

  function handleClose() {
    const okIds = outcomes.filter((item) => item.ok).map((item) => item.id);
    const failedIds = failed.map((item) => item.id);
    onFinished(okIds, failedIds);
    onClose();
  }

  return (
    <Dialog
      visible={visible}
      header="批量转派"
      width={620}
      footer={false}
      destroyOnClose
      closeOnOverlayClick={false}
      onClose={handleClose}
      onCancel={handleClose}
    >
      {!ran ? (
        <div className="transfer-form">
          <p className="muted">
            已选 {targets.length} 条线索。转派逐条提交，失败的行会保留原因，可单独重试。
          </p>
          <div className="field">
            <label className="field__label">目标顾问</label>
            <div className="advisor-picks">
              {advisors.map((advisor) => {
                const selected = advisor.id === targetOwnerId;
                return (
                  <Button
                    key={advisor.id}
                    size="small"
                    theme={selected ? 'primary' : 'default'}
                    variant={selected ? 'base' : 'outline'}
                    aria-pressed={selected}
                    onClick={() => setTargetOwnerId(advisor.id)}
                  >
                    {advisor.name}
                  </Button>
                );
              })}
            </div>
            {advisorError && <p className="field__error">{advisorError}</p>}
          </div>
          {running && (
            <p className="muted" data-testid="transfer-progress">
              正在转派 {progress.done}/{progress.total} …
            </p>
          )}
          <div className="dialog-actions">
            <Button theme="default" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button
              theme="primary"
              disabled={!targetOwnerId || running}
              loading={running}
              onClick={() => runTransfer(targets.map((item) => item.id))}
            >
              开始转派
            </Button>
          </div>
        </div>
      ) : (
        <div className="transfer-result">
          <p className="transfer-summary" data-testid="transfer-summary">
            {failed.length === 0
              ? '全部 ' + okCount + ' 条转派成功'
              : '成功 ' + okCount + ' 条，失败 ' + failed.length + ' 条'}
          </p>
          {failed.length > 0 && (
            <ul className="failure-list">
              {failed.map((item) => (
                <li className="failure-row" key={item.id} data-testid="transfer-failure-row">
                  <span className="failure-row__company">{item.company}</span>
                  <span className="failure-row__reason">{item.reason}</span>
                </li>
              ))}
            </ul>
          )}
          {running && (
            <p className="muted" data-testid="transfer-progress">
              正在转派 {progress.done}/{progress.total} …
            </p>
          )}
          <div className="dialog-actions">
            {failed.length > 0 && (
              <Button
                theme="default"
                variant="outline"
                loading={running}
                onClick={() => runTransfer(failed.map((item) => item.id))}
              >
                仅重试失败 {failed.length} 条
              </Button>
            )}
            <Button theme="primary" onClick={handleClose}>
              关闭
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
