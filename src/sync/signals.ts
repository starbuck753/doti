export const LOCAL_CHANGE_EVENT = 'doti-local-change'

export function notifyLocalChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(LOCAL_CHANGE_EVENT))
}
