import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import type { Task, TaskStatus } from '../types'
import { updateTask } from '../services/data'
import KanbanColumn from './KanbanColumn'

const COLUMNS: TaskStatus[] = ['todo', 'doing', 'waiting', 'done']

export default function KanbanView({
  tasks,
  onOpen,
  onQuickAdd,
}: {
  tasks: Task[]
  onOpen: (t: Task) => void
  onQuickAdd: (status: TaskStatus) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const taskId = String(active.id)
    const targetStatus = String(over.id) as TaskStatus

    if (COLUMNS.includes(targetStatus)) {
      const currentTask = tasks.find(t => t.id === taskId)
      if (currentTask && currentTask.status !== targetStatus) {
        await updateTask(taskId, {
          status: targetStatus,
          completedAt: targetStatus === 'done' ? Date.now() : null,
        })
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {COLUMNS.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            onOpen={onOpen}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </DndContext>
  )
}
