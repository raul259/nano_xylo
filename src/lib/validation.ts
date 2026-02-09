import { z } from "zod"

export const TASK_STATUSES = ["todo", "doing", "done"] as const
export const PRIORITIES = ["low", "medium", "high"] as const

const changeSchema = z.object({
  field: z.string(),
  oldValue: z.unknown().optional(),
  newValue: z.unknown().optional(),
})

export const auditLogSchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  accion: z.enum(["CREATE", "UPDATE", "MOVE", "DELETE"]),
  taskId: z.string().min(1),
  taskTitulo: z.string().min(1),
  userLabel: z.string().min(1),
  prevHash: z.string().optional(),
  hash: z.string().optional(),
  changes: z.array(changeSchema).optional(),
})

export const taskSchema = z.object({
  id: z.string().min(1),
  publicId: z.string().min(1).optional(),
  titulo: z.string().min(3),
  descripcion: z.string().optional(),
  prioridad: z.enum(PRIORITIES),
  tags: z.array(z.string()).default([]),
  estimacionMin: z.number().int().min(1),
  fechaCreacion: z.string().datetime(),
  fechaLimite: z.string().datetime().optional(),
  estado: z.enum(TASK_STATUSES),
  observacionesJavi: z.string().optional(),
  rubricaNota: z.number().int().min(0).max(10).optional(),
  rubricaComentario: z.string().optional(),
})

export const boardDataSchema = z.object({
  tasks: z.array(taskSchema),
  logs: z.array(auditLogSchema),
})

export const taskFormSchema = z.object({
  titulo: z.string().min(3, "El titulo debe tener al menos 3 caracteres."),
  descripcion: z.string().optional(),
  prioridad: z.enum(PRIORITIES),
  tags: z.string().optional(),
  estimacionMin: z.coerce
    .number()
    .int("La estimacion debe ser un numero entero.")
    .min(1, "La estimacion debe ser mayor que 0."),
  fechaLimite: z.string().optional(),
  estado: z.enum(TASK_STATUSES),
  observacionesJavi: z.string().optional(),
  rubricaNota: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? undefined : value),
    z.number().int().min(0).max(10).optional()
  ),
  rubricaComentario: z.string().optional(),
}).superRefine((values, ctx) => {
  if (!values.fechaLimite) return
  const dueDate = new Date(`${values.fechaLimite}T00:00:00`)
  if (Number.isNaN(dueDate.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fechaLimite"],
      message: "La fecha limite no es valida.",
    })
    return
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (dueDate < today) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["fechaLimite"],
      message: "La fecha limite no puede ser anterior a hoy.",
    })
  }
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
