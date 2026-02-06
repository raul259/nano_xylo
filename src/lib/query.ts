import type { Priority, Task } from "@/types"

export type EstimationFilter = {
  op: "<" | "<=" | ">" | ">=" | "="
  value: number
}

export type SearchQuery = {
  raw: string
  text: string
  tag?: string
  priority?: Priority
  due?: "overdue" | "week"
  estimation?: EstimationFilter
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

const parseEstimation = (value: string): EstimationFilter | undefined => {
  const match = value.match(/^(<=|>=|<|>|=)?\s*(\d+)$/)
  if (!match) return undefined
  const op = (match[1] as EstimationFilter["op"]) ?? "="
  const amount = Number(match[2])
  if (!Number.isFinite(amount)) return undefined
  return { op, value: amount }
}

export const parseSearchQuery = (input: string): SearchQuery => {
  const tokens = input.split(/\s+/).filter(Boolean)
  const textParts: string[] = []
  let tag: string | undefined
  let priority: Priority | undefined
  let due: SearchQuery["due"]
  let estimation: EstimationFilter | undefined

  tokens.forEach((token) => {
    const lower = token.toLowerCase()
    if (lower.startsWith("tag:")) {
      const value = token.slice(4)
      if (value) {
        tag = value
      } else {
        textParts.push(token)
      }
      return
    }
    if (lower.startsWith("p:")) {
      const value = lower.slice(2)
      if (value === "low" || value === "medium" || value === "high") {
        priority = value as Priority
      } else {
        textParts.push(token)
      }
      return
    }
    if (lower.startsWith("due:")) {
      const value = lower.slice(4)
      if (value === "overdue" || value === "week") {
        due = value
      } else {
        textParts.push(token)
      }
      return
    }
    if (lower.startsWith("est:")) {
      const value = lower.slice(4)
      const parsed = parseEstimation(value)
      if (parsed) {
        estimation = parsed
      } else {
        textParts.push(token)
      }
      return
    }
    textParts.push(token)
  })

  return {
    raw: input,
    text: textParts.join(" ").trim(),
    tag,
    priority,
    due,
    estimation,
  }
}

const matchesText = (task: Task, queryText: string) => {
  if (!queryText) return true
  const haystack = `${task.titulo} ${task.descripcion ?? ""}`.toLowerCase()
  return haystack.includes(queryText.toLowerCase())
}

const matchesTag = (task: Task, tag?: string) => {
  if (!tag) return true
  const normalizedTag = normalize(tag)
  return task.tags.some((taskTag) => normalize(taskTag).includes(normalizedTag))
}

const matchesPriority = (task: Task, priority?: Priority) => {
  if (!priority) return true
  return task.prioridad === priority
}

const matchesDue = (task: Task, due?: SearchQuery["due"]) => {
  if (!due) return true
  if (!task.fechaLimite) return false
  const dueDate = new Date(task.fechaLimite)
  if (Number.isNaN(dueDate.getTime())) return false
  const now = new Date()
  if (due === "overdue") {
    return dueDate.getTime() < now.getTime()
  }
  if (due === "week") {
    const nextWeek = new Date(now)
    nextWeek.setDate(now.getDate() + 7)
    return dueDate.getTime() >= now.getTime() && dueDate.getTime() <= nextWeek.getTime()
  }
  return true
}

const matchesEstimation = (task: Task, estimation?: EstimationFilter) => {
  if (!estimation) return true
  const value = task.estimacionMin
  switch (estimation.op) {
    case "<":
      return value < estimation.value
    case "<=":
      return value <= estimation.value
    case ">":
      return value > estimation.value
    case ">=":
      return value >= estimation.value
    case "=":
    default:
      return value === estimation.value
  }
}

export const filterTasks = (tasks: Task[], query: SearchQuery) => {
  return tasks.filter(
    (task) =>
      matchesText(task, query.text) &&
      matchesTag(task, query.tag) &&
      matchesPriority(task, query.priority) &&
      matchesDue(task, query.due) &&
      matchesEstimation(task, query.estimation)
  )
}
