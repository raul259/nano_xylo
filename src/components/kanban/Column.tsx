"use client"

import * as React from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { CalendarIcon, ClockIcon, GripVerticalIcon, Trash2Icon } from "lucide-react"

import type { Priority, Task, TaskStatus } from "@/types"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TaskFormDialog } from "@/components/kanban/TaskFormDialog"

type ColumnProps = {
  id: TaskStatus
  title: string
  tasks: Task[]
  godMode: boolean
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

export function Column({
  id,
  title,
  tasks,
  godMode,
  onUpdateTask,
  onDeleteTask,
}: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "bg-card text-card-foreground flex h-full min-h-[320px] flex-col gap-4 rounded-lg border p-4 shadow-sm transition",
        isOver && "ring-ring/40 ring-2"
      )}
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide">{title}</h2>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
            Sin misiones en esta columna.
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              godMode={godMode}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
            />
          ))
        )}
      </div>
    </section>
  )
}

type TaskCardProps = {
  task: Task
  godMode: boolean
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
}

function TaskCard({ task, godMode, onUpdateTask, onDeleteTask }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition: isDragging ? "none" : "transform 110ms ease-out",
    willChange: "transform",
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background flex flex-col gap-3 rounded-md border p-3 shadow-sm",
        isDragging && "opacity-85"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold leading-snug">{task.titulo}</h3>
          <Badge variant="outline" className={getPriorityMeta(task.prioridad).className}>
            {getPriorityMeta(task.prioridad).label}
          </Badge>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md p-1 transition focus-visible:outline-none focus-visible:ring-2"
          aria-label="Arrastrar tarea"
          {...attributes}
          {...listeners}
        >
          <GripVerticalIcon className="h-4 w-4" />
        </button>
      </div>

      {task.descripcion ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {task.descripcion}
        </p>
      ) : null}

      {task.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => {
            const meta = getTagMeta(tag)
            return (
              <Badge
                variant="outline"
                key={tag}
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide",
                  meta.className
                )}
              >
                {meta.label}
              </Badge>
            )
          })}
        </div>
      ) : null}

      <div className="text-muted-foreground flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3.5 w-3.5" />
          <span>{task.estimacionMin} min</span>
        </div>
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>{task.fechaLimite ? formatDate(task.fechaLimite) : "Sin limite"}</span>
        </div>
      </div>

      {godMode ? (
        <div className="rounded-md border border-dashed p-2 text-xs">
          <div className="font-semibold">Observaciones de Javi</div>
          <p className="text-muted-foreground mt-1">
            {task.observacionesJavi || "Sin observaciones"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="info" className="text-[10px]">
              Rubrica: {typeof task.rubricaNota === "number" ? task.rubricaNota : "Sin evaluar"}
            </Badge>
            {task.rubricaComentario ? (
              <span className="text-muted-foreground">{task.rubricaComentario}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <TaskFormDialog
          triggerLabel="Editar"
          title="Editar mision"
          description="Ajusta los detalles y guarda los cambios."
          submitLabel="Guardar cambios"
          initialTask={task}
          onSubmitTask={onUpdateTask}
          showGodFields={godMode}
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" aria-label="Eliminar tarea">
              <Trash2Icon className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar mision</AlertDialogTitle>
              <AlertDialogDescription>
                Esta accion no se puede deshacer. Se eliminara la mision "{task.titulo}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDeleteTask(task.id)}>
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </article>
  )
}

type TagMeta = {
  label: string
  className: string
}

const TAG_MAP: Array<{
  keywords: string[]
  meta: TagMeta
}> = [
  {
    keywords: ["urgente", "critico", "critica"],
    meta: {
      label: "\u{1F534} [CRITICO] - Impacto inmediato",
      className: "bg-red-100 text-red-800 border border-red-200",
    },
  },
  {
    keywords: ["importante"],
    meta: {
      label: "\u{1F7E0} [IMPORTANTE] - Aporta valor, no corre prisa",
      className: "bg-orange-100 text-orange-800 border border-orange-200",
    },
  },
  {
    keywords: ["recurrente"],
    meta: {
      label: "\u{1F535} [RECURRENTE] - Algo que haces siempre",
      className: "bg-sky-100 text-sky-800 border border-sky-200",
    },
  },
  {
    keywords: ["bajo impacto"],
    meta: {
      label: "\u{26AA} [BAJO IMPACTO] - Si sobra tiempo",
      className: "bg-slate-100 text-slate-700 border border-slate-200",
    },
  },
]

const DEFAULT_TAG_META: TagMeta = {
  label: "",
  className: "bg-muted text-muted-foreground",
}

function normalizeTag(tag: string) {
  return tag
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\[\]{}()]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function getTagMeta(tag: string): TagMeta {
  const normalized = normalizeTag(tag)
  const match = TAG_MAP.find((entry) =>
    entry.keywords.some((keyword) => normalized === normalizeTag(keyword))
  )
  if (match) {
    return match.meta
  }
  return {
    ...DEFAULT_TAG_META,
    label: tag,
  }
}

type PriorityMeta = {
  label: string
  className: string
}

const PRIORITY_META: Record<Priority, PriorityMeta> = {
  low: {
    label: "Baja",
    className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
  medium: {
    label: "Media",
    className: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  high: {
    label: "Alta",
    className: "bg-rose-100 text-rose-800 border border-rose-200",
  },
}

function getPriorityMeta(priority: Priority) {
  return PRIORITY_META[priority]
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-ES")
  } catch {
    return iso
  }
}
