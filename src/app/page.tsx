"use client"

import * as React from "react"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { ClipboardCopyIcon, DownloadIcon, FileUpIcon, InfoIcon } from "lucide-react"
import { toast } from "sonner"

import type { AuditAction, BoardData, Task, TaskStatus } from "@/types"
import {
  createAuditLog,
  getFromStorage,
  saveToStorage,
  validateImportData,
} from "@/lib/storage"
import { filterTasks, parseSearchQuery } from "@/lib/query"
import { Column } from "@/components/kanban/Column"
import { CreateTask } from "@/components/kanban/CreateTask"
import { AuditTable } from "@/components/audit/AuditTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const AUDIT_ACTION_OPTIONS: Array<{ value: AuditAction | "ALL"; label: string }> = [
  { value: "ALL", label: "Todas" },
  { value: "CREATE", label: "Crear" },
  { value: "UPDATE", label: "Actualizar" },
  { value: "MOVE", label: "Mover" },
  { value: "DELETE", label: "Eliminar" },
]

export default function KanbanPage() {
  const [boardData, setBoardData] = React.useState<BoardData>({
    tasks: [],
    logs: [],
  })
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [auditAction, setAuditAction] = React.useState<AuditAction | "ALL">("ALL")
  const [auditTaskId, setAuditTaskId] = React.useState("")
  const [importErrors, setImportErrors] = React.useState<string[] | null>(null)
  const [godMode, setGodMode] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  React.useEffect(() => {
    setBoardData(getFromStorage())
    setIsLoaded(true)
  }, [])

  const persist = (data: BoardData) => {
    setBoardData(data)
    saveToStorage(data)
  }

  const addTask = (newTask: Task) => {
    const newLog = createAuditLog("CREATE", newTask.titulo, newTask.id, undefined, newTask)
    const newData = {
      tasks: [newTask, ...boardData.tasks],
      logs: [newLog, ...boardData.logs],
    }
    persist(newData)
    toast.success("Mision creada y registrada")
  }

  const updateTask = (updatedTask: Task) => {
    const previousTask = boardData.tasks.find((task) => task.id === updatedTask.id)
    if (!previousTask) return
    const newLog = createAuditLog(
      "UPDATE",
      updatedTask.titulo,
      updatedTask.id,
      previousTask,
      updatedTask
    )
    const newData = {
      tasks: boardData.tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      logs: [newLog, ...boardData.logs],
    }
    persist(newData)
    toast.success("Mision actualizada")
  }

  const deleteTask = (taskId: string) => {
    const previousTask = boardData.tasks.find((task) => task.id === taskId)
    if (!previousTask) return
    const newLog = createAuditLog(
      "DELETE",
      previousTask.titulo,
      taskId,
      previousTask,
      undefined
    )
    const newData = {
      tasks: boardData.tasks.filter((task) => task.id !== taskId),
      logs: [newLog, ...boardData.logs],
    }
    persist(newData)
    toast.success("Mision eliminada")
  }

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return
    const taskId = active.id as string
    const newStatus = over.id as TaskStatus

    const taskToMove = boardData.tasks.find((task) => task.id === taskId)
    if (!taskToMove || taskToMove.estado === newStatus) return

    const newTask = { ...taskToMove, estado: newStatus }
    const newLog = createAuditLog(
      "MOVE",
      taskToMove.titulo,
      taskId,
      taskToMove,
      newTask
    )

    const updatedTasks = boardData.tasks.map((task) =>
      task.id === taskId ? newTask : task
    )
    const newData = { tasks: updatedTasks, logs: [newLog, ...boardData.logs] }

    persist(newData)
    toast.info(`Mision movida a ${newStatus}`)
  }

  const parsedQuery = React.useMemo(() => parseSearchQuery(search), [search])

  const filteredTasks = React.useMemo(() => {
    return filterTasks(boardData.tasks, parsedQuery)
  }, [boardData.tasks, parsedQuery])

  const filteredLogs = React.useMemo(() => {
    return boardData.logs.filter((log) => {
      const matchesAction = auditAction === "ALL" || log.accion === auditAction
      const matchesTask = auditTaskId
        ? log.taskId.toLowerCase().includes(auditTaskId.toLowerCase())
        : true
      return matchesAction && matchesTask
    })
  }, [boardData.logs, auditAction, auditTaskId])

  const handleCopySummary = async () => {
    const counts = filteredLogs.reduce<Record<AuditAction, number>>(
      (acc, log) => {
        acc[log.accion] += 1
        return acc
      },
      { CREATE: 0, UPDATE: 0, MOVE: 0, DELETE: 0 }
    )

    const summary = [
      `Resumen de auditoria (${new Date().toLocaleString("es-ES")})`,
      `Total eventos: ${filteredLogs.length}`,
      `CREATE: ${counts.CREATE}, UPDATE: ${counts.UPDATE}, MOVE: ${counts.MOVE}, DELETE: ${counts.DELETE}`,
      "",
      "Ultimos eventos:",
      ...filteredLogs.slice(0, 5).map(
        (log) => `- ${log.accion} | ${log.taskTitulo} | ${log.taskId}`
      ),
    ].join("\n")

    try {
      await navigator.clipboard.writeText(summary)
      toast.success("Resumen copiado al portapapeles")
    } catch {
      toast.error("No se pudo copiar el resumen")
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(boardData, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `nano-xylo-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Exportacion lista")
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImportErrors(null)
    try {
      const content = await file.text()
      const raw = JSON.parse(content)
      const result = validateImportData(raw)
      if (!result.ok) {
        setImportErrors(result.errors)
        toast.error("Importacion con errores")
        return
      }
      persist(result.data)
      if (result.regenerated.length > 0) {
        toast.info("IDs duplicados regenerados y auditados")
      } else {
        toast.success("Importacion completada")
      }
    } catch (error) {
      setImportErrors(["El archivo no es un JSON valido."])
      toast.error("Importacion fallida")
    } finally {
      event.target.value = ""
    }
  }

  const godSummary = React.useMemo(() => {
    const scored = boardData.tasks.filter(
      (task) => typeof task.rubricaNota === "number"
    )
    const pending = boardData.tasks.filter(
      (task) => typeof task.rubricaNota !== "number"
    )
    const average =
      scored.length > 0
        ? (
            scored.reduce((sum, task) => sum + (task.rubricaNota ?? 0), 0) /
            scored.length
          ).toFixed(1)
        : "-"

    return {
      promedio: average,
      evaluadas: scored.length,
      pendientes: pending.length,
    }
  }, [boardData.tasks])

  if (!isLoaded) {
    return (
      <div className="p-10 text-center font-mono">DESCIFRANDO DATOS...</div>
    )
  }

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase">
              Nano Xylo
            </h1>
            <p className="text-muted-foreground">Protocolo nano-xylo v1.0</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar texto, tag:forense, p:high..."
                className="w-64"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar tareas"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Ver ejemplos de busqueda"
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 rounded-md p-2 transition focus-visible:outline-none focus-visible:ring-2"
                    >
                      <InfoIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Ejemplos: tag:forense, p:high, due:overdue, est:&gt;=120
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CreateTask onTaskCreated={addTask} showGodFields={godMode} />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
            <Button variant="outline" size="sm" onClick={handleImportClick}>
              <FileUpIcon className="mr-2 h-4 w-4" />
              Importar JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImportChange}
            />
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-md border px-3 py-2">
              <Switch
                checked={godMode}
                onCheckedChange={setGodMode}
                aria-label="Activar modo dios"
              />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Modo Dios
              </span>
            </div>
          </div>
        </header>

        {importErrors && importErrors.length > 0 ? (
          <Alert variant="destructive">
            <AlertTitle>Errores de importacion</AlertTitle>
            <AlertDescription>
              {importErrors.map((error) => (
                <div key={error}>{error}</div>
              ))}
            </AlertDescription>
          </Alert>
        ) : null}

        <Tabs defaultValue="board">
          <TabsList>
            <TabsTrigger value="board">Tablero</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <TabsContent value="board">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={onDragEnd}
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {(["todo", "doing", "done"] as TaskStatus[]).map((status) => (
                  <Column
                    key={status}
                    id={status}
                    title={
                      status === "todo"
                        ? "PENDIENTE"
                        : status === "doing"
                          ? "EN CURSO"
                          : "COMPLETADO"
                    }
                    tasks={filteredTasks.filter((task) => task.estado === status)}
                    godMode={godMode}
                    onUpdateTask={updateTask}
                    onDeleteTask={deleteTask}
                  />
                ))}
              </div>
            </DndContext>

            {godMode ? (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Promedio Rubrica
                  </div>
                  <div className="mt-2 text-2xl font-bold">{godSummary.promedio}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Tareas evaluadas
                  </div>
                  <div className="mt-2 text-2xl font-bold">{godSummary.evaluadas}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Sin evaluar
                  </div>
                  <div className="mt-2 text-2xl font-bold">{godSummary.pendientes}</div>
                </div>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="audit">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-56">
                  <Select
                    value={auditAction}
                    onValueChange={(value) =>
                      setAuditAction(value as AuditAction | "ALL")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Accion" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIT_ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  className="w-64"
                  placeholder="Filtrar por taskId"
                  value={auditTaskId}
                  onChange={(event) => setAuditTaskId(event.target.value)}
                  aria-label="Filtrar por taskId"
                />
                <Button variant="outline" size="sm" onClick={handleCopySummary}>
                  <ClipboardCopyIcon className="mr-2 h-4 w-4" />
                  Copiar resumen
                </Button>
                <Badge variant="muted">
                  {filteredLogs.length} eventos
                </Badge>
              </div>
              <AuditTable logs={filteredLogs} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
