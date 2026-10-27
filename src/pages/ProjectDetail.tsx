import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Calendar,
  Kanban,
  List,
} from 'lucide-react'
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
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft size={16} aria-hidden /> {t('project.all')}
        </Link>
        <p className="text-slate-500">Project not found.</p>
      </div>
    )
  }

  const progress = projectProgress(project.id, tasks)

  return (
    <div className="max-w-6xl space-y-6">
      {/* Back button & Header */}
      <div>
        <Link
          to="/projects"
          className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft size={15} aria-hidden /> {t('project.all')}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="h-5 w-5 rounded-full shadow-xs"
              style={{ backgroundColor: project.color }}
            />
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {project.name}
            </h1>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              {progress}% {t('task.completed')}
            </span>
          </div>

          {/* View mode switcher */}
          <div className="flex items-center rounded-2xl glass-panel p-1 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                view === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <List size={15} aria-hidden /> {t('project.viewList')}
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                view === 'kanban'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Kanban size={15} aria-hidden /> {t('project.viewKanban')}
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                view === 'calendar'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar size={15} aria-hidden /> {t('project.viewCalendar')}
            </button>
          </div>
        </div>
      </div>

      {/* Main View Content */}
      {view === 'list' && (
        <div className="max-w-3xl space-y-4">
          <QuickAdd />
          {projectTasks.length === 0 ? (
            <p className="text-slate-500">{t('task.empty')}</p>
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
