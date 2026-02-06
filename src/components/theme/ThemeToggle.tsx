"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Switch } from "@/components/ui/switch"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 rounded-md border px-3 py-2">
        <div className="h-5 w-9 rounded-full border bg-muted" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          Tema
        </span>
      </div>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center gap-2 rounded-md border px-3 py-2">
      {isDark ? (
        <MoonIcon className="h-4 w-4 text-muted-foreground" />
      ) : (
        <SunIcon className="h-4 w-4 text-muted-foreground" />
      )}
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Cambiar tema claro u oscuro"
      />
      <span className="text-xs font-semibold uppercase tracking-wide">
        Tema
      </span>
    </div>
  )
}
