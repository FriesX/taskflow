import { describe, expect, it } from 'vitest'
import {
  chunkArray,
  friendshipPairId,
  generateFriendCode,
  mergeUniqueTasks,
  normalizeFriendLookup,
  projectInviteId,
  sortedPair,
} from './socialLogic'
import type { Task } from '../types'

const makeTask = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  description: '',
  status: 'todo',
  priority: 0,
  startAt: null,
  dueAt: null,
  completedAt: null,
  projectId: null,
  parentTaskId: null,
  labelIds: [],
  ownerId: 'alice',
  assigneeId: null,
  deletedAt: null,
  createdAt: 1,
  updatedAt: 1,
  ...over,
})

describe('socialLogic', () => {
  it('creates deterministic sorted friendship pair IDs and tuples', () => {
    expect(friendshipPairId('bob', 'alice')).toBe('alice_bob')
    expect(friendshipPairId('alice', 'bob')).toBe('alice_bob')
    expect(sortedPair('bob', 'alice')).toEqual(['alice', 'bob'])
  })

  it('creates deterministic project invite IDs', () => {
    expect(projectInviteId('proj1', 'bob')).toBe('proj1_bob')
  })

  it('normalizes email and friend code lookups', () => {
    expect(normalizeFriendLookup('  Alice@Example.COM ')).toEqual({
      kind: 'email',
      value: 'alice@example.com',
    })
    expect(normalizeFriendLookup('tf-8a2c')).toEqual({
      kind: 'code',
      value: 'TF-8A2C',
    })
    expect(normalizeFriendLookup('8a2c')).toEqual({
      kind: 'code',
      value: 'TF-8A2C',
    })
    expect(normalizeFriendLookup('not-an-email@')).toBeNull()
    expect(normalizeFriendLookup('   ')).toBeNull()
  })

  it('generates valid TF-XXXX friend codes', () => {
    const code = generateFriendCode()
    expect(code).toMatch(/^TF-[A-Z0-9]{4}$/)
  })

  it('chunks arrays for Firestore in-query limits', () => {
    const items = Array.from({ length: 65 }, (_, i) => `p${i}`)
    const chunks = chunkArray(items, 30)
    expect(chunks).toHaveLength(3)
    expect(chunks[0]).toHaveLength(30)
    expect(chunks[1]).toHaveLength(30)
    expect(chunks[2]).toHaveLength(5)
  })

  it('merges personal and shared project tasks without duplicates', () => {
    const own = [makeTask('t1', { updatedAt: 10 }), makeTask('t2', { updatedAt: 5 })]
    const shared = [
      makeTask('t1', { title: 'Updated t1', updatedAt: 20 }),
      makeTask('t3', { ownerId: 'bob', projectId: 'p1', updatedAt: 15 }),
    ]
    const merged = mergeUniqueTasks(own, shared)
    expect(merged).toHaveLength(3)
    expect(merged.find(t => t.id === 't1')?.title).toBe('Updated t1')
    expect(merged.find(t => t.id === 't3')?.ownerId).toBe('bob')
  })
})
