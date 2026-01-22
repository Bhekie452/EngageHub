import { analyticsService } from '../services/api/analytics.service';

// lightweight session id (client only)
export function getSessionId(): string {
  const key = 'eh_session_id';
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(key, id);
  return id;
}

export async function trackEventSafe(event: Parameters<typeof analyticsService.track>[0]) {
  try {
    await analyticsService.track({ ...event, session_id: event.session_id ?? getSessionId() });
  } catch {
    // swallow analytics errors; don't break app UX
  }
}

