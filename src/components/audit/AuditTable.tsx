"use client"

import * as React from "react"

import type { AuditLog, AuditAction } from "@/types"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type AuditTableProps = {
  logs: AuditLog[]
}

const ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "CREAR",
  UPDATE: "ACTUALIZAR",
  MOVE: "MOVER",
  DELETE: "ELIMINAR",
}

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-sky-100 text-sky-800",
  MOVE: "bg-amber-100 text-amber-800",
  DELETE: "bg-rose-100 text-rose-800",
}

function formatValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ")
  }
  if (value === null || value === undefined || value === "") {
    return "—"
  }
  return String(value)
}

function formatChanges(log: AuditLog) {
  if (!log.changes || log.changes.length === 0) {
    return "—"
  }
  return log.changes
    .map(
      (change) =>
        `${change.field}: ${formatValue(change.oldValue)} -> ${formatValue(
          change.newValue
        )}`
    )
    .join(" | ")
}

export function AuditTable({ logs }: AuditTableProps) {
  if (logs.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed p-6 text-sm">
        Aun no hay registros de auditoria.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Accion</TableHead>
          <TableHead>Mision</TableHead>
          <TableHead>Usuario</TableHead>
          <TableHead>Cambios</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="text-muted-foreground text-xs">
              {new Date(log.timestamp).toLocaleString("es-ES")}
            </TableCell>
            <TableCell>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  ACTION_STYLES[log.action]
                )}
              >
                {ACTION_LABELS[log.action]}
              </span>
            </TableCell>
            <TableCell className="font-medium">{log.taskTitle}</TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {log.userLabel}
            </TableCell>
            <TableCell className="text-muted-foreground text-xs">
              {formatChanges(log)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
