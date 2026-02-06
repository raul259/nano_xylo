import type { Task } from "@/types"
import { TaskFormDialog } from "@/components/kanban/TaskFormDialog"

type CreateTaskProps = {
  onTaskCreated: (task: Task) => void
  showGodFields?: boolean
}

export function CreateTask({ onTaskCreated, showGodFields = false }: CreateTaskProps) {
  return (
    <TaskFormDialog
      triggerLabel="Nueva mision"
      title="Crear nueva mision"
      description="Define el objetivo, etiquetas y estado inicial."
      submitLabel="Crear mision"
      onSubmitTask={onTaskCreated}
      showGodFields={showGodFields}
    />
  )
}
