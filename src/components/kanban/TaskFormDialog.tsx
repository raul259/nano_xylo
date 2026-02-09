"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, type Resolver, useForm } from "react-hook-form"
import { CalendarIcon, PlusIcon, SaveIcon } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import type { Task } from "@/types"
import {
  PRIORITIES,
  TASK_STATUSES,
  taskFormSchema,
  type TaskFormValues,
} from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PRIORITY_LABELS: Record<(typeof PRIORITIES)[number], string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
}

const STATUS_LABELS: Record<(typeof TASK_STATUSES)[number], string> = {
  todo: "Pendiente",
  doing: "En curso",
  done: "Completado",
}

type TaskFormDialogProps = {
  triggerLabel: string
  title: string
  description: string
  submitLabel: string
  initialTask?: Task
  onSubmitTask: (task: Task) => void
  showGodFields?: boolean
}

const parseTags = (input: string) =>
  Array.from(
    new Set(
      input
        .split(/[,\n]/)
        .map((tag) => tag.trim().replace(/^#/, ""))
        .filter(Boolean)
    )
  )

const toDateInputValue = (iso?: string) => (iso ? iso.slice(0, 10) : "")
const todayInputValue = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const defaultValuesFromTask = (task?: Task): TaskFormValues => {
  if (!task) {
    return {
      titulo: "",
      descripcion: "",
      prioridad: "medium",
      tags: "",
      estimacionMin: 60,
      fechaLimite: "",
      estado: "todo",
      observacionesJavi: "",
      rubricaNota: undefined,
      rubricaComentario: "",
    }
  }

  return {
    titulo: task.titulo,
    descripcion: task.descripcion ?? "",
    prioridad: task.prioridad,
    tags: task.tags.join(", "),
    estimacionMin: task.estimacionMin,
    fechaLimite: toDateInputValue(task.fechaLimite),
    estado: task.estado,
    observacionesJavi: task.observacionesJavi ?? "",
    rubricaNota: task.rubricaNota,
    rubricaComentario: task.rubricaComentario ?? "",
  }
}

const buildTaskFromValues = (
  values: TaskFormValues,
  base?: Task,
  includeGodFields?: boolean
): Task => {
  const extraTags = parseTags(values.tags ?? "")
  const fechaLimite = values.fechaLimite
    ? new Date(`${values.fechaLimite}T00:00:00`).toISOString()
    : undefined
  const rubricaNota =
    typeof values.rubricaNota === "number" ? values.rubricaNota : undefined

  return {
    id: base?.id ?? uuidv4(),
    titulo: values.titulo.trim(),
    descripcion: values.descripcion?.trim() || undefined,
    prioridad: values.prioridad,
    tags: extraTags,
    estimacionMin: values.estimacionMin,
    fechaCreacion: base?.fechaCreacion ?? new Date().toISOString(),
    fechaLimite,
    estado: values.estado,
    observacionesJavi: includeGodFields
      ? values.observacionesJavi?.trim() || undefined
      : base?.observacionesJavi,
    rubricaNota: includeGodFields ? rubricaNota : base?.rubricaNota,
    rubricaComentario: includeGodFields
      ? values.rubricaComentario?.trim() || undefined
      : base?.rubricaComentario,
  }
}

export function TaskFormDialog({
  triggerLabel,
  title,
  description,
  submitLabel,
  initialTask,
  onSubmitTask,
  showGodFields = false,
}: TaskFormDialogProps) {
  const [open, setOpen] = React.useState(false)

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema) as Resolver<TaskFormValues>,
    defaultValues: defaultValuesFromTask(initialTask),
  })

  React.useEffect(() => {
    if (open) {
      form.reset(defaultValuesFromTask(initialTask))
    }
  }, [open, initialTask, form])

  const onSubmit = form.handleSubmit((values) => {
    onSubmitTask(buildTaskFromValues(values, initialTask, showGodFields))
    setOpen(false)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="whitespace-nowrap">
          {initialTask ? (
            <SaveIcon className="mr-2 h-4 w-4" />
          ) : (
            <PlusIcon className="mr-2 h-4 w-4" />
          )}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-title">
              Titulo
            </label>
            <Input
              id="task-title"
              {...form.register("titulo")}
              placeholder="Analizar trafico sospechoso"
            />
            {form.formState.errors.titulo ? (
              <p className="text-destructive text-xs font-medium">
                {form.formState.errors.titulo.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-description">
              Descripcion (opcional)
            </label>
            <textarea
              id="task-description"
              {...form.register("descripcion")}
              placeholder="Contexto, pasos clave o dependencias."
              className={cn(
                "border-input bg-background ring-offset-background placeholder:text-muted-foreground min-h-[88px] w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-tags">
              Tags
            </label>
            <Input
              id="task-tags"
              {...form.register("tags")}
              placeholder="urgente, forense, phishing"
            />
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="task-priority">
                Prioridad
              </label>
              <Controller
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-priority">
                      <SelectValue placeholder="Selecciona prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {PRIORITY_LABELS[priority]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="task-status">
                Estado inicial
              </label>
              <Controller
                control={form.control}
                name="estado"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="task-status">
                      <SelectValue placeholder="Selecciona estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="task-estimation">
                Estimacion (min)
              </label>
              <Input
                id="task-estimation"
                type="number"
                min={1}
                step={1}
                {...form.register("estimacionMin")}
              />
              {form.formState.errors.estimacionMin ? (
                <p className="text-destructive text-xs font-medium">
                  {form.formState.errors.estimacionMin.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="task-due">
                Fecha limite (opcional)
              </label>
              <div className="relative">
                <CalendarIcon className="text-muted-foreground pointer-events-none absolute left-3 top-2.5 h-4 w-4" />
                <Input
                  id="task-due"
                  type="date"
                  className="pl-9"
                  min={todayInputValue()}
                  {...form.register("fechaLimite")}
                />
              </div>
              {form.formState.errors.fechaLimite ? (
                <p className="text-destructive text-xs font-medium">
                  {form.formState.errors.fechaLimite.message}
                </p>
              ) : null}
            </div>
          </div>

          {showGodFields ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium" htmlFor="task-observations">
                Observaciones de Javi
              </label>
              <textarea
                id="task-observations"
                {...form.register("observacionesJavi")}
                placeholder="Notas internas sobre la tarea."
                className={cn(
                  "border-input bg-background ring-offset-background placeholder:text-muted-foreground min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                )}
              />
            </div>
          ) : null}

          {showGodFields ? (
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="task-score">
                  Rubrica (0-10)
                </label>
                <Input
                  id="task-score"
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  {...form.register("rubricaNota", { valueAsNumber: true })}
                />
                {form.formState.errors.rubricaNota ? (
                  <p className="text-destructive text-xs font-medium">
                    {form.formState.errors.rubricaNota.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor="task-score-comment">
                  Comentario de rubrica
                </label>
                <Input
                  id="task-score-comment"
                  {...form.register("rubricaComentario")}
                  placeholder="Ej: Buena ejecucion"
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
