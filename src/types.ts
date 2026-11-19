export type TaskStatus = 'todo' | 'doing' | 'waiting' | 'done' | 'archived'
export type Priority = 0 | 1 | 2 | 3 | 4 // 0 none, 1 low, 2 medium, 3 high, 4 urgent

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: Priority
  startAt: number | null
  dueAt: number | null
  completedAt: number | null
  projectId: string | null
  parentTaskId: string | null
  labelIds: string[]
  ownerId: string
  assigneeId: string | null
  deletedAt: number | null
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  name: string
  color: string
  icon: string
  ownerId: string
  memberIds: string[]
  status: 'active' | 'archived'
  createdAt: number
}

export interface Label {
  id: string
  name: string
  color: string
  ownerId: string
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  friendCode: string
  updatedAt: number
}

export type FriendshipStatus = 'pending' | 'accepted'

export interface Friendship {
  id: string
  users: [string, string]
  requesterId: string
  recipientId: string
  status: FriendshipStatus
  createdAt: number
  updatedAt: number
}

export interface ProjectInvite {
  id: string
  projectId: string
  projectName: string
  projectColor: string
  inviterId: string
  inviteeId: string
  status: 'pending'
  createdAt: number
}
