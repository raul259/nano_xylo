import { Task, AuditLog, BoardData, AuditAction } from "@/types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "micro-trello-data";

export const saveToStorage = (data: BoardData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const normalizeBoardData = (data: BoardData): BoardData => {
  return {
    tasks: (data.tasks ?? []).map((task) => ({
      ...task,
      tags: Array.isArray(task.tags) ? task.tags : [],
    })),
    logs: data.logs ?? [],
  };
};

export const getFromStorage = (): BoardData => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return { tasks: [], logs: [] };
  }
  try {
    return normalizeBoardData(JSON.parse(data));
  } catch {
    return { tasks: [], logs: [] };
  }
};

// LA JOYA DE LA CORONA: El generador de Diffs
export const createAuditLog = (
  action: AuditAction,
  taskTitle: string,
  taskId: string,
  oldTask?: Task,
  newTask?: Task
): AuditLog => {
  const changes: AuditLog["changes"] = [];

  if (action === "UPDATE" || action === "MOVE") {
    if (oldTask && newTask) {
      (Object.keys(newTask) as (keyof Task)[]).forEach((key) => {
        // Ignoramos campos que no aportan valor al diff visual
        if (key !== "id" && key !== "createdAt" && oldTask[key] !== newTask[key]) {
          changes.push({
            field: key,
            oldValue: oldTask[key],
            newValue: newTask[key],
          });
        }
      });
    }
  }

  return {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    action,
    taskId,
    taskTitle,
    userLabel: "Alumno/a",
    changes: changes.length > 0 ? changes : undefined,
  };
};
