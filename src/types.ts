export type TaskStatus = "todo" | "doing" | "done"

export type Priority = "low" | "medium" | "high"

export type Task = {
  id: string
  titulo: string
  descripcion?: string
  prioridad: Priority
  tags: string[]
  estimacionMin: number
  fechaCreacion: string
  fechaLimite?: string
  estado: TaskStatus
  observacionesJavi?: string
  rubricaNota?: number
  rubricaComentario?: string
}

export type AuditAction = "CREATE" | "UPDATE" | "MOVE" | "DELETE"

export type AuditLog = {
  id: string
  timestamp: string
  accion: AuditAction
  taskId: string
  taskTitulo: string
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
