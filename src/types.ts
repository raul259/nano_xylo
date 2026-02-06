export type TaskStatus = "todo" | "doing" | "done"

export type Task = {
  id: string
  title: string
  description?: string
  tags: string[]
  status: TaskStatus
  createdAt: string
}

export type AuditAction = "CREATE" | "UPDATE" | "MOVE" | "DELETE"

export type AuditLog = {
  id: string
  timestamp: string
  action: AuditAction
  taskId: string
  taskTitle: string
  userLabel: string
  changes?: Array<{
    field: keyof Task | string
    oldValue?: unknown
    newValue?: unknown
  }>
}

export type BoardData = {
  tasks: Task[]
  logs: AuditLog[]
}
