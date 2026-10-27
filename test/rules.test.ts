import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

const task = (over: Record<string, unknown> = {}) => ({
  id: 't1', title: 'Hello', description: '', status: 'todo', priority: 2,
  startAt: null, dueAt: null, completedAt: null, projectId: null, parentTaskId: null,
  labelIds: [], ownerId: 'alice', assigneeId: null, deletedAt: null,
  createdAt: 1, updatedAt: 1, ...over,
})
const project = (over: Record<string, unknown> = {}) => ({
  name: 'P', color: '#6366f1', icon: 'folder', ownerId: 'alice',
  memberIds: ['alice', 'bob'], status: 'active', createdAt: 1, ...over,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-taskflow',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 },
  })
})
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const as = (uid: string) => env.authenticatedContext(uid).firestore()

describe('tasks', () => {
  it('owner can create and read own task', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'tasks/t1'), task()))
    await assertSucceeds(getDoc(doc(as('alice'), 'tasks/t1')))
  })
  it('unauthenticated users are denied', async () => {
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), 'tasks/t1'), task()))
  })
  it('cannot create task owned by someone else', async () => {
    await assertFails(setDoc(doc(as('mallory'), 'tasks/t1'), task()))
  })
  it('other users cannot read a private task', async () => {
    await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'tasks/t1'), task()))
    await assertFails(getDoc(doc(as('bob'), 'tasks/t1')))
  })
  it('rejects invalid priority and empty title', async () => {
    await assertFails(setDoc(doc(as('alice'), 'tasks/t1'), task({ priority: 9 })))
    await assertFails(setDoc(doc(as('alice'), 'tasks/t1'), task({ title: '' })))
  })
  it('project member can read and update but not delete', async () => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project())
      await setDoc(doc(c.firestore(), 'tasks/t1'), task({ projectId: 'p1' }))
    })
    await assertSucceeds(getDoc(doc(as('bob'), 'tasks/t1')))
    await assertSucceeds(updateDoc(doc(as('bob'), 'tasks/t1'), { status: 'done', updatedAt: 2 }))
    await assertFails(deleteDoc(doc(as('bob'), 'tasks/t1')))
  })
  it('non-members cannot read project tasks', async () => {
    await env.withSecurityRulesDisabled(async c => {
      await setDoc(doc(c.firestore(), 'projects/p1'), project())
      await setDoc(doc(c.firestore(), 'tasks/t1'), task({ projectId: 'p1' }))
    })
    await assertFails(getDoc(doc(as('eve'), 'tasks/t1')))
  })
})

describe('projects', () => {
  it('owner creates; non-owner cannot update', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'projects/p1'), project()))
    await assertFails(updateDoc(doc(as('bob'), 'projects/p1'), { name: 'X' }))
  })
})

describe('users', () => {
  it('only the user can read own profile', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice'), { name: 'A' }))
    await assertFails(getDoc(doc(as('bob'), 'users/alice')))
  })
})
