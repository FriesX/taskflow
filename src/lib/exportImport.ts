import type { Label, Project, Task } from '../types'

export interface TaskFlowBackup {
  version: string
  exportedAt: string
  tasks: Task[]
  projects: Project[]
  labels: Label[]
}

/** Escapes values for safe CSV formatting */
function escapeCSV(val: string | number | null | undefined): string {
  if (val == null) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function exportToJSON(tasks: Task[], projects: Project[], labels: Label[]): string {
  const data: TaskFlowBackup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tasks,
    projects,
    labels,
  }
  return JSON.stringify(data, null, 2)
}

export function exportToCSV(tasks: Task[], projects: Project[], labels: Label[]): string {
  const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Project', 'Labels', 'Description']
  const rows = tasks.map(t => {
    const proj = projects.find(p => p.id === t.projectId)
    const taskLabels = t.labelIds
      .map(id => labels.find(l => l.id === id)?.name)
      .filter(Boolean)
      .join('; ')
    const dueStr = t.dueAt ? new Date(t.dueAt).toISOString() : ''

    return [
      escapeCSV(t.title),
      escapeCSV(t.status),
      escapeCSV(t.priority),
      escapeCSV(dueStr),
      escapeCSV(proj?.name || ''),
      escapeCSV(taskLabels),
      escapeCSV(t.description),
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Parses CSV text into task items */
export function parseCSVTasks(csvText: string): Array<{ title: string; description: string; priority: number; status: string }> {
  const lines = csvText.trim().split(/\r?\n/)
  if (lines.length <= 1) return []

  const result: Array<{ title: string; description: string; priority: number; status: string }> = []
  // Assume first line is header: Title, Status, Priority, Due Date, Project, Labels, Description
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Regex to split by comma outside quotes
    const values: string[] = []
    let inQuotes = false
    let current = ''
    for (let c = 0; c < line.length; c++) {
      const char = line[c]
      if (char === '"' && line[c + 1] === '"') {
        current += '"'
        c++
      } else if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)

    const title = values[0]?.trim()
    if (title) {
      result.push({
        title,
        status: values[1]?.trim() || 'todo',
        priority: Number(values[2]) || 0,
        description: values[6]?.trim() || '',
      })
    }
  }
  return result
}
