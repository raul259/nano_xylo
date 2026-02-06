"use client";

import React, { useState, useEffect, useMemo } from "react";
import { DndContext, DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { BoardData, TaskStatus, Task } from "@/types";
import { getFromStorage, saveToStorage, createAuditLog } from "@/lib/storage";
import { Column } from "@/components/kanban/Column";
import { CreateTask } from "@/components/kanban/CreateTask";
import { AuditTable } from "@/components/audit/AuditTable";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function KanbanPage() {
  const [boardData, setBoardData] = useState<BoardData>({ tasks: [], logs: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    setBoardData(getFromStorage());
    setIsLoaded(true);
  }, []);

  const addTask = (newTask: Task) => {
    const newLog = createAuditLog("CREATE", newTask.title, newTask.id, undefined, newTask);
    const newData = {
      tasks: [newTask, ...boardData.tasks],
      logs: [newLog, ...boardData.logs],
    };
    setBoardData(newData);
    saveToStorage(newData);
    toast.success("Misión creada y registrada");
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const taskToMove = boardData.tasks.find((t) => t.id === taskId);
    if (!taskToMove || taskToMove.status === newStatus) return;

    const newTask = { ...taskToMove, status: newStatus };
    const newLog = createAuditLog("MOVE", taskToMove.title, taskId, taskToMove, newTask);

    const updatedTasks = boardData.tasks.map((t) => (t.id === taskId ? newTask : t));
    const newData = { tasks: updatedTasks, logs: [newLog, ...boardData.logs] };

    setBoardData(newData);
    saveToStorage(newData);
    toast.info(`Misión movida a ${newStatus}`);
  };

  // Filtrado básico (luego le meteremos el Parser de Regex para el nivel 10)
  const filteredTasks = useMemo(() => {
    return boardData.tasks.filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) || 
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }, [boardData.tasks, search]);

  if (!isLoaded) return <div className="p-10 text-center font-mono">DESCIFRANDO DATOS...</div>;

  return (
    <main className="min-h-screen bg-background p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter uppercase">NANO_XYLO</h1>
          <p className="text-muted-foreground">Protocolo nano-xylo v1.0</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Input 
            placeholder="Buscar por título o tag..." 
            className="max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <CreateTask onTaskCreated={addTask} />
        </div>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(["todo", "doing", "done"] as TaskStatus[]).map((status) => (
            <Column 
              key={status}
              id={status} 
              title={status === "todo" ? "PENDIENTE" : status === "doing" ? "EN CURSO" : "COMPLETADO"} 
              tasks={filteredTasks.filter((t) => t.status === status)} 
            />
          ))}
        </div>
      </DndContext>

      <footer className="mt-16 space-y-6">
        <div className="flex justify-between items-end border-b pb-2">
          <h2 className="text-2xl font-bold tracking-tight">LOGS DE AUDITORÍA</h2>
        </div>
        <AuditTable logs={boardData.logs} />
      </footer>
    </main>
  );
}