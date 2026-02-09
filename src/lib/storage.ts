import { v4 as uuidv4 } from "uuid"

import type { AuditAction, AuditLog, BoardData, Priority, Task, TaskStatus } from "@/types"
import { createPublicId, fnv1a } from "@/lib/hash"
import { boardDataSchema, PRIORITIES, TASK_STATUSES } from "@/lib/validation"

const STORAGE_KEY = "micro-trello-data"

const DEFAULT_PRIORITY: Priority = "medium"
const DEFAULT_STATUS: TaskStatus = "todo"
const DEFAULT_ESTIMATION = 60

type LegacyTask = Partial<Task> & {
  title?: string
  description?: string
  status?: TaskStatus
  createdAt?: string
  dueDate?: string
  priority?: Priority
}

type LegacyLog = Partial<AuditLog> & {
  action?: AuditAction
  taskTitle?: string
}

const isPriority = (value: unknown): value is Priority =>
  PRIORITIES.includes(value as Priority)

const isStatus = (value: unknown): value is TaskStatus =>
  TASK_STATUSES.includes(value as TaskStatus)

const toArray = (value: unknown) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : []

const normalizeTask = (raw: LegacyTask): Task => {
  const titulo =
    typeof raw.titulo === "string"
      ? raw.titulo
      : typeof raw.title === "string"
        ? raw.title
        : "Sin titulo"

  const descripcion =
    typeof raw.descripcion === "string"
      ? raw.descripcion
      : typeof raw.description === "string"
        ? raw.description
        : undefined

  const prioridad = isPriority(raw.prioridad)
    ? raw.prioridad
    : isPriority(raw.priority)
      ? raw.priority
      : DEFAULT_PRIORITY

  const estado = isStatus(raw.estado)
    ? raw.estado
    : isStatus(raw.status)
      ? raw.status
      : DEFAULT_STATUS

  const estimacionMin =
    typeof raw.estimacionMin === "number" && Number.isFinite(raw.estimacionMin)
      ? Math.max(1, Math.round(raw.estimacionMin))
      : DEFAULT_ESTIMATION

  const fechaCreacion =
    typeof raw.fechaCreacion === "string"
      ? raw.fechaCreacion
      : typeof raw.createdAt === "string"
        ? raw.createdAt
        : new Date().toISOString()

  const fechaLimite =
    typeof raw.fechaLimite === "string"
      ? raw.fechaLimite
      : typeof raw.dueDate === "string"
        ? raw.dueDate
        : undefined

  const id = raw.id && typeof raw.id === "string" ? raw.id : uuidv4()

  return {
    id,
    publicId:
      typeof raw.publicId === "string" && raw.publicId
        ? raw.publicId
        : createPublicId(id),
    titulo,
    descripcion,
    prioridad,
    tags: toArray(raw.tags),
    estimacionMin,
    fechaCreacion,
    fechaLimite,
    estado,
    observacionesJavi:
      typeof raw.observacionesJavi === "string" ? raw.observacionesJavi : undefined,
    rubricaNota:
      typeof raw.rubricaNota === "number" && Number.isFinite(raw.rubricaNota)
        ? raw.rubricaNota
        : undefined,
    rubricaComentario:
      typeof raw.rubricaComentario === "string" ? raw.rubricaComentario : undefined,
  }
}

const normalizeLog = (raw: LegacyLog): AuditLog => {
  const accion: AuditAction =
    raw.accion ??
    raw.action ??
    (["CREATE", "UPDATE", "MOVE", "DELETE"] as const)[0]

  return {
    id: raw.id && typeof raw.id === "string" ? raw.id : uuidv4(),
    timestamp:
      typeof raw.timestamp === "string" ? raw.timestamp : new Date().toISOString(),
    accion,
    taskId: typeof raw.taskId === "string" ? raw.taskId : "desconocido",
    taskTitulo:
      typeof raw.taskTitulo === "string"
        ? raw.taskTitulo
        : typeof raw.taskTitle === "string"
          ? raw.taskTitle
          : "Sin titulo",
    userLabel: typeof raw.userLabel === "string" ? raw.userLabel : "Alumno/a",
    prevHash: typeof raw.prevHash === "string" ? raw.prevHash : undefined,
    hash: typeof raw.hash === "string" ? raw.hash : undefined,
    changes: Array.isArray(raw.changes) ? raw.changes : undefined,
  }
}

const buildLogHash = (log: Omit<AuditLog, "hash">) => {
  return fnv1a(
    JSON.stringify({
      timestamp: log.timestamp,
      accion: log.accion,
      taskId: log.taskId,
      taskTitulo: log.taskTitulo,
      userLabel: log.userLabel,
      changes: log.changes,
      prevHash: log.prevHash,
    })
  )
}

const ensureLogChain = (logs: AuditLog[]) => {
  const nextLogs = [...logs]
  let prevHash: string | undefined

  for (let i = nextLogs.length - 1; i >= 0; i -= 1) {
    const log = nextLogs[i]
    const withPrev: Omit<AuditLog, "hash"> = {
      ...log,
      prevHash,
    }
    const hash = buildLogHash(withPrev)
    nextLogs[i] = { ...withPrev, hash }
    prevHash = hash
  }

  return nextLogs
}

export const verifyLogChain = (
  logs: AuditLog[]
): { ok: true } | { ok: false; index: number } => {
  let prevHash: string | undefined

  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const log = logs[i]
    if (log.prevHash !== prevHash) {
      return { ok: false, index: i }
    }
    const expected = buildLogHash({
      ...log,
      prevHash,
    })
    if (log.hash !== expected) {
      return { ok: false, index: i }
    }
    prevHash = expected
  }

  return { ok: true }
}

const normalizeBoardData = (data: BoardData): BoardData => {
  return {
    tasks: (data.tasks ?? []).map(normalizeTask),
    logs: ensureLogChain((data.logs ?? []).map(normalizeLog)),
  }
}

export const saveToStorage = (data: BoardData): BoardData => {
  const normalized: BoardData = {
    tasks: data.tasks.map((task) => ({
      ...task,
      publicId: task.publicId || createPublicId(task.id),
    })),
    logs: ensureLogChain(data.logs),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
  return normalized
}

export const getFromStorage = (): BoardData => {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    return { tasks: [], logs: [] }
  }
  try {
    return normalizeBoardData(JSON.parse(data))
  } catch {
    return { tasks: [], logs: [] }
  }
}

type AuditLogOptions = {
  includeId?: boolean
  forceChanges?: AuditLog["changes"]
  prevHash?: string
}

const buildDiff = (
  accion: AuditAction,
  oldTask?: Task,
  newTask?: Task,
  includeId?: boolean
) => {
  if (!oldTask && !newTask) {
    return undefined
  }

  const changes: AuditLog["changes"] = []
  const keys = new Set<keyof Task>()
  if (oldTask) {
    ;(Object.keys(oldTask) as (keyof Task)[]).forEach((key) => keys.add(key))
  }
  if (newTask) {
    ;(Object.keys(newTask) as (keyof Task)[]).forEach((key) => keys.add(key))
  }

  keys.forEach((key) => {
    if (key === "fechaCreacion") {
      return
    }
    if (!includeId && key === "id") {
      return
    }
    const oldValue = oldTask ? oldTask[key] : undefined
    const newValue = newTask ? newTask[key] : undefined

    if (accion === "CREATE") {
      changes.push({ field: key, oldValue: undefined, newValue })
      return
    }
    if (accion === "DELETE") {
      changes.push({ field: key, oldValue, newValue: undefined })
      return
    }
    if (oldValue !== newValue) {
      changes.push({ field: key, oldValue, newValue })
    }
  })

  return changes.length > 0 ? changes : undefined
}

export const createAuditLog = (
  accion: AuditAction,
  taskTitulo: string,
  taskId: string,
  oldTask?: Task,
  newTask?: Task,
  options?: AuditLogOptions
): AuditLog => {
  const changes = options?.forceChanges ?? buildDiff(accion, oldTask, newTask, options?.includeId)

  const baseLog: Omit<AuditLog, "hash"> = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    accion,
    taskId,
    taskTitulo,
    userLabel: "Alumno/a",
    prevHash: options?.prevHash,
    changes,
  }
  const hash = buildLogHash(baseLog)

  return {
    ...baseLog,
    hash,
  }
}

export type ImportResult =
  | { ok: true; data: BoardData; regenerated: Array<{ oldId: string; newId: string }> }
  | { ok: false; errors: string[] }

export const validateImportData = (raw: unknown): ImportResult => {
  const parsed = boardDataSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((error) => {
        const path = error.path.join(".")
        return path ? `${path}: ${error.message}` : error.message
      }),
    }
  }

  const data = parsed.data
  const seen = new Set<string>()
  const regenerated: Array<{ oldId: string; newId: string }> = []
  const tasks = data.tasks.map((task) => {
    if (!seen.has(task.id)) {
      seen.add(task.id)
      return task
    }

    const oldId = task.id
    const newId = uuidv4()
    seen.add(newId)
    regenerated.push({ oldId, newId })
    return { ...task, id: newId }
  })

  if (regenerated.length === 0) {
    return { ok: true, data: { tasks, logs: data.logs }, regenerated }
  }

  const logs = [...data.logs]
  regenerated.forEach(({ oldId, newId }) => {
    const task = tasks.find((item) => item.id === newId)
    if (!task) {
      return
    }
    logs.unshift(
      createAuditLog(
        "UPDATE",
        task.titulo,
        newId,
        { ...task, id: oldId },
        task,
        { includeId: true }
      )
    )
  })

  return {
    ok: true,
    data: {
      tasks,
      logs,
    },
    regenerated,
  }
}
