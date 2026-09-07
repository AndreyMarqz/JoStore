import type { ClientDetails } from '../types/store'

const sessionStorageKey = 'jostore.session.v1'

export function getStoredSession(): ClientDetails | null {
  try {
    const stored = localStorage.getItem(sessionStorageKey)
    return stored ? JSON.parse(stored) as ClientDetails : null
  } catch {
    return null
  }
}

export function saveSession(client: ClientDetails) {
  localStorage.setItem(sessionStorageKey, JSON.stringify(client))
}

export function clearSession() {
  localStorage.removeItem(sessionStorageKey)
}
