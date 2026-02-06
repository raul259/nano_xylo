"use client"

import * as React from "react"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVerticalIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types"

type ColumnProps = {
  id: TaskStatus
  title: string
  tasks: Task[]
}

export function Column({ id, title, tasks }: ColumnProps) {
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
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </section>
  )
}

function TaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
    })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: "transform 150ms ease",
  }

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-background flex cursor-grab flex-col gap-2 rounded-md border p-3 shadow-sm active:cursor-grabbing",
        isDragging && "opacity-60"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
        <GripVerticalIcon className="text-muted-foreground h-4 w-4" />
      </div>

      {task.description ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {task.description}
        </p>
      ) : null}

      {task.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {task.tags.map((tag) => {
            const meta = getTagMeta(tag)
            return (
              <span
                key={tag}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide",
                  meta.className
                )}
              >
                {meta.label}
              </span>
            )
          })}
        </div>
      ) : null}
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
      label: "🔴 [CRÍTICO] - Impacto inmediato",
      className: "bg-red-100 text-red-800 border border-red-200",
    },
  },
  {
    keywords: ["importante"],
    meta: {
      label: "🟠 [IMPORTANTE] - Aporta valor, no corre prisa",
      className: "bg-orange-100 text-orange-800 border border-orange-200",
    },
  },
  {
    keywords: ["recurrente"],
    meta: {
      label: "🔵 [RECURRENTE] - Algo que haces siempre",
      className: "bg-sky-100 text-sky-800 border border-sky-200",
    },
  },
  {
    keywords: ["bajo impacto"],
    meta: {
      label: "⚪ [BAJO IMPACTO] - Si sobra tiempo",
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
