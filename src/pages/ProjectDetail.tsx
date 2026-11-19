import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, Kanban, List } from 'lucide-react'
import { useData } from '../context/DataContext'
import { isDeleted, projectProgress } from '../lib/taskLogic'
import type { Task, TaskStatus } from '../types'
import TaskItem from '../components/TaskItem'
import TaskDialog from '../components/TaskDialog'
import KanbanView from '../components/KanbanView'
import CalendarView from '../components/CalendarView'
import QuickAdd from '../components/QuickAdd'

type ViewMode = 'list' | 'kanban' | 'calendar'

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const { t } = useTranslation()
  const { projects, tasks } = useData()
  const [view, setView] = useState<ViewMode>('list')
  const [editing, setEditing] = useState<Task | null>(null)
  const [open, setOpen] = useState(false)

  const project = projects.find(p => p.id === projectId)
  const projectTasks = tasks.filter(
    t => t.projectId === projectId && !isDeleted(t) && !t.parentTaskId,
  )

  const openTask = (task: Task) => {
    setEditing(task)
    setOpen(true)
  }

  const addNewTask = (status?: TaskStatus) => {
    setEditing(
      status
        ? ({
            id: '',
            title: '',
            description: '',
            status,
            priority: 0,
            startAt: null,
            dueAt: null,
            completedAt: null,
            projectId: projectId || null,
            parentTaskId: null,
            labelIds: [],
            ownerId: '',
            assigneeId: null,
            deletedAt: null,
            createdAt: 0,
            updatedAt: 0,
          } as Task)
        : null,
    )
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
      projectId: projectId || null,
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

  if (!project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
          <ArrowLeft size={15} aria-hidden /> {t('project.all')}
        </Link>
        <p className="text-sm text-[var(--ink-muted)]">Project not found.</p>
      </div>
    )
  }

  const progress = projectProgress(project.id, tasks)

  return (
    <div className="max-w-6xl space-y-6">
      <div className="border-b border-[var(--border)] pb-4">
        <Link
          to="/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft size={14} aria-hidden /> {t('project.all')}
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: project.color }} />
            <h1 className="font-display text-2xl font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-3xl">
              {project.name}
            </h1>
            <span className="rounded-md bg-[var(--success-soft)] px-2.5 py-1 font-mono-data text-xs font-semibold text-[var(--success)]">
              {progress}% {t('task.completed')}
            </span>
          </div>

          <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-1">
            {([
              { id: 'list', label: t('project.viewList'), Icon: List },
              { id: 'kanban', label: t('project.viewKanban'), Icon: Kanban },
              { id: 'calendar', label: t('project.viewCalendar'), Icon: Calendar },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  view === id
                    ? 'bg-[var(--ink)] text-[var(--bg-canvas)]'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink)]'
                }`}
              >
                <Icon size={14} aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'list' && (
        <div className="max-w-3xl space-y-4">
          <QuickAdd />
          {projectTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)]/60 p-10 text-center">
              <p className="text-sm text-[var(--ink-muted)]">{t('task.empty')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {projectTasks
                .sort((a, b) => {
                  if (a.status === 'done' && b.status !== 'done') return 1
                  if (a.status !== 'done' && b.status === 'done') return -1
                  return (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity) || b.priority - a.priority
                })
                .map(x => (
                  <TaskItem key={x.id} task={x} onOpen={openTask} />
                ))}
            </ul>
          )}
        </div>
      )}

      {view === 'kanban' && (
        <KanbanView
          tasks={projectTasks}
          onOpen={openTask}
          onQuickAdd={status => addNewTask(status)}
        />
      )}

      {view === 'calendar' && (
        <CalendarView
          tasks={projectTasks}
          onOpen={openTask}
          onAddTaskDate={handleAddTaskDate}
        />
      )}

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
