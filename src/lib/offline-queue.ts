import { get, set, del, keys } from 'idb-keyval';

export interface QueuedAction {
  id: string;
  action: 'start' | 'pause' | 'resume' | 'stop';
  payload: Record<string, any>;
  timestamp: number;
  retryCount?: number;
  lastError?: string;
}

const QUEUE_PREFIX = 'sproj-offline-action:';

export async function enqueueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const item: QueuedAction = {
    ...action,
    id,
    timestamp: Date.now(),
    retryCount: 0,
  };
  await set(`${QUEUE_PREFIX}${id}`, item);
  return id;
}

export async function getQueuedActions(): Promise<QueuedAction[]> {
  try {
    const allKeys = await keys();
    const queueKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(QUEUE_PREFIX));

    const actions: QueuedAction[] = [];
    for (const key of queueKeys) {
      const action = await get<QueuedAction>(key);
      if (action) actions.push(action);
    }
    return actions.sort((a, b) => a.timestamp - b.timestamp);
  } catch (err) {
    console.error('Failed to read offline queue:', err);
    return [];
  }
}

export async function updateQueuedAction(action: QueuedAction): Promise<void> {
  await set(`${QUEUE_PREFIX}${action.id}`, action);
}

export async function removeQueuedAction(id: string): Promise<void> {
  await del(`${QUEUE_PREFIX}${id}`);
}

const MAX_RETRIES = 3;

async function executeQueueInternal(
  executor: (action: QueuedAction) => Promise<boolean | void>
): Promise<number> {
  const actions = await getQueuedActions();
  let completed = 0;

  for (const action of actions) {
    try {
      const result = await executor(action);
      if (result !== false) {
        await removeQueuedAction(action.id);
        completed++;
      } else {
        const retries = (action.retryCount || 0) + 1;
        if (retries >= MAX_RETRIES) {
          console.warn(`Dropping poison-pill action ${action.id} after ${retries} failed attempts.`);
          await removeQueuedAction(action.id);
        } else {
          await updateQueuedAction({ ...action, retryCount: retries });
          break; // Stop on retryable failure
        }
      }
    } catch (err: any) {
      console.error('Error executing queued action:', err);
      const retries = (action.retryCount || 0) + 1;
      if (retries >= MAX_RETRIES) {
        console.warn(`Dropping action ${action.id} after ${retries} fatal exceptions.`);
        await removeQueuedAction(action.id);
      } else {
        await updateQueuedAction({
          ...action,
          retryCount: retries,
          lastError: err?.message || String(err),
        });
        break;
      }
    }
  }

  return completed;
}

export async function flushOfflineQueue(
  executor: (action: QueuedAction) => Promise<boolean | void>
): Promise<number> {
  if (typeof navigator !== 'undefined' && 'locks' in navigator && (navigator as any).locks?.request) {
    return await (navigator as any).locks.request('sproj-offline-queue-flush', async () => {
      return await executeQueueInternal(executor);
    });
  }
  return await executeQueueInternal(executor);
}
