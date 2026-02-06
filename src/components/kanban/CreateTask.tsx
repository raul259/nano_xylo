"use client"

import * as React from "react"
import { PlusIcon } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import type { Task, TaskStatus } from "@/types"
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
import { cn } from "@/lib/utils"

type CreateTaskProps = {
  onTaskCreated: (task: Task) => void
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "todo", label: "Pendiente" },
  { value: "doing", label: "En curso" },
  { value: "done", label: "Completado" },
]

const IMPACT_TAG_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "urgente", label: "🔴 [CRÍTICO] - Impacto inmediato" },
  { value: "importante", label: "🟠 [IMPORTANTE] - Aporta valor, no corre prisa" },
  { value: "recurrente", label: "🔵 [RECURRENTE] - Algo que haces siempre" },
  { value: "bajo impacto", label: "⚪ [BAJO IMPACTO] - Si sobra tiempo" },
]

export function CreateTask({ onTaskCreated }: CreateTaskProps) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [impactTag, setImpactTag] = React.useState("importante")
  const [status, setStatus] = React.useState<TaskStatus>("todo")
  const [error, setError] = React.useState<string | null>(null)

  const resetForm = React.useCallback(() => {
    setTitle("")
    setDescription("")
    setImpactTag("importante")
    setStatus("todo")
    setError(null)
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      resetForm()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError("El titulo es obligatorio.")
      return
    }

    const newTask: Task = {
      id: uuidv4(),
      title: trimmedTitle,
      description: description.trim() ? description.trim() : undefined,
      tags: [impactTag],
      status,
      createdAt: new Date().toISOString(),
    }

    onTaskCreated(newTask)
    setOpen(false)
    resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="whitespace-nowrap">
          <PlusIcon className="mr-2 h-4 w-4" />
          Nueva mision
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear nueva mision</DialogTitle>
          <DialogDescription>
            Define el objetivo, etiquetas y estado inicial.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-title">
              Titulo
            </label>
            <Input
              id="task-title"
              placeholder="Analizar trafico sospechoso"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-description">
              Descripcion (opcional)
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contexto, pasos clave o dependencias."
              className={cn(
                "border-input bg-background ring-offset-background placeholder:text-muted-foreground min-h-[88px] w-full rounded-md border px-3 py-2 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              )}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-impact">
              Etiqueta de impacto
            </label>
            <select
              id="task-impact"
              value={impactTag}
              onChange={(event) => setImpactTag(event.target.value)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              {IMPACT_TAG_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium" htmlFor="task-status">
              Estado inicial
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as TaskStatus)}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring/50 h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="text-destructive text-xs font-medium">{error}</p>
          ) : null}

          <DialogFooter>
            <Button type="submit">Crear mision</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
