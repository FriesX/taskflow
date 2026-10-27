import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useData } from '../context/DataContext'
import { isDeleted } from '../lib/taskLogic'
import type { Task } from '../types'
import CalendarView from '../components/CalendarView'
import TaskDialog from '../components/TaskDialog'

export default function CalendarPage() {
  const { t } = useTranslation()
  const { tasks } = useData()
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)

  const activeTasks = tasks.filter(t => !isDeleted(t) && !t.parentTaskId)

  const openTask = (task: Task) => {
    setEditing(task)
    setOpen(true)
  }

  const handleAddTaskDate = (date: Date) => {
    setEditing({
      id: '',
      title: '',
      description: '',
      status: 'todo',
      priority: 0,
      startAt: null,
      dueAt: date.getTime(),
      completedAt: null,
      projectId: null,
      parentTaskId: null,
      labelIds: [],
      ownerId: '',
      assigneeId: null,
      deletedAt: null,
      createdAt: 0,
      updatedAt: 0,
    } as Task)
    setOpen(true)
  }

  return (
    <div className="max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">{t('nav.calendar')}</h1>
      <CalendarView
        tasks={activeTasks}
        onOpen={openTask}
        onAddTaskDate={handleAddTaskDate}
      />
      <TaskDialog
        task={editing}
        open={open}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
      />
    </div>
  )
}
