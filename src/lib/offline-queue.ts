import { get, set, del, keys } from 'idb-keyval';

export interface QueuedAction {
  id: string;
  action: 'start' | 'pause' | 'resume' | 'stop';
  payload: Record<string, any>;
  timestamp: number;
}

const QUEUE_PREFIX = 'sproj-offline-action:';

export async function enqueueAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<string> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const item: QueuedAction = {
    ...action,
    id,
    timestamp: Date.now(),
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

export async function removeQueuedAction(id: string): Promise<void> {
  await del(`${QUEUE_PREFIX}${id}`);
}

export async function flushOfflineQueue(
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
        break; // Stop on failure
      }
    } catch (err) {
      console.error('Error executing queued action:', err);
      break;
    }
  }

  return completed;
}
