/**
 * Request browser notification permission from the user.
 * @returns True if permission was granted
 */
export async function requestPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

/**
 * Show a browser notification if the page is not currently visible.
 * @param title - Notification title
 * @param body - Notification body text
 * @param icon - Optional icon URL (defaults to '/icon.png')
 */
export function notify(title: string, body: string, icon = '/icon.png'): void {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible') return
  new Notification(title, { body, icon })
}
