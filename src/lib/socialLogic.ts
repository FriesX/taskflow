import type { Task } from '../types'

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Deterministic sorted document ID for a friendship pair between two users. */
export function friendshipPairId(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}_${uidB}` : `${uidB}_${uidA}`
}

/** Deterministic sorted 2-element user tuple for Firestore array-contains queries. */
export function sortedPair(uidA: string, uidB: string): [string, string] {
  return uidA < uidB ? [uidA, uidB] : [uidB, uidA]
}

/** Deterministic document ID for a project invitation. */
export function projectInviteId(projectId: string, inviteeId: string): string {
  return `${projectId}_${inviteeId}`
}

/**
 * Classifies and normalizes a friend lookup input into either an email or a `TF-XXXX` friend code.
 * Returns null if the input does not match either format.
 */
export function normalizeFriendLookup(
  raw: string,
): { kind: 'email'; value: string } | { kind: 'code'; value: string } | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  if (trimmed.includes('@')) {
    const email = trimmed.toLowerCase()
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { kind: 'email', value: email }
    }
    return null
  }

  const upper = trimmed.toUpperCase().replace(/\s+/g, '')
  const withPrefix = upper.startsWith('TF-') ? upper : `TF-${upper}`
  if (/^TF-[A-Z0-9]{4,8}$/.test(withPrefix)) {
    return { kind: 'code', value: withPrefix }
  }

  return null
}

/** Generates a readable unique-candidate friend code in the format `TF-XXXX`. */
export function generateFriendCode(length = 4): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length)
    out += CODE_ALPHABET[idx]
  }
  return `TF-${out}`
}

/** Trims and collapses inner whitespace in a display name; returns null if empty or >100 chars. */
export function normalizeDisplayName(raw: string): string | null {
  const cleaned = raw.trim().replace(/\s+/g, ' ')
  if (cleaned.length < 1 || cleaned.length > 100) return null
  return cleaned
}

/** Splits an array into fixed-size chunks (used for Firestore `in` query limit of 30). */
export function chunkArray<T>(items: readonly T[], size = 30): T[][] {
  if (size <= 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/** Merges personal tasks and shared project tasks without duplicates (newer updatedAt wins). */
export function mergeUniqueTasks(ownTasks: readonly Task[], sharedTasks: readonly Task[]): Task[] {
  const map = new Map<string, Task>()
  for (const t of ownTasks) {
    map.set(t.id, t)
  }
  for (const t of sharedTasks) {
    const existing = map.get(t.id)
    if (!existing || t.updatedAt >= existing.updatedAt) {
      map.set(t.id, t)
    }
  }
  return Array.from(map.values())
}
