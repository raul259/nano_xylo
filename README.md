# Nano Xylo

## ¿Qué es?
Nano Xylo es una app sencilla tipo Kanban para organizar misiones y darles seguimiento. La idea es mantenerlo claro y rápido de usar: crear tareas, moverlas entre columnas y revisar la auditoría de cambios.

## Cómo usarla
```bash
npm install
npm run dev
```
Luego abre el navegador y crea una misión con el botón “Nueva misión”.

## Qué puedes hacer
- Crear, editar y eliminar misiones.
- Arrastrar tarjetas entre columnas.
- Buscar por texto o con filtros rápidos (tag, prioridad, fechas, estimación).
- Exportar e importar tus datos en JSON.
- Ver auditoría de cambios con un resumen rápido.
- Usar el “Modo Dios” para campos extra de evaluación.

## Detalles importantes
- La fecha límite no permite fechas anteriores a hoy.
- El arrastre de tarjetas evita el zoom o distorsión visual.
- Todo queda guardado en el navegador (localStorage).

## Capturas
- `public/capturas/tablero.png`
- `public/capturas/formulario.png`
- `public/capturas/auditoria.png`

## Link de Vercel
https://nano-xylo.vercel.app/

## Futuras mejoras (hashing)
- Identificador público por hash: generar un `publicId` estable a partir del `id` interno para compartir referencias sin exponer el ID real.
- Cadena de auditoría: encadenar hashes en los logs para detectar alteraciones en el historial.

## Checklist de requisitos
- [x] 3 columnas fijas Todo / Doing / Done
- [x] Crear, editar y borrar tareas
- [x] Drag & Drop entre columnas
- [x] Modelo de datos completo (id, título, descripción, prioridad, tags, estimación, fechas, estado)
- [x] Auditoría CREATE / UPDATE / DELETE / MOVE con diff
- [x] Tabla de auditoría con filtros y botón “Copiar resumen”
- [x] Búsqueda avanzada con operadores (tag, p, due, est)
- [x] Persistencia en localStorage
- [x] Exportar / Importar JSON con validación y regeneración de IDs
- [x] Modo Dios con observaciones, rúbrica y panel resumen
- [x] Componentes Shadcn usados (Dialog, Select, Badge, Tabs, Table, Toast, AlertDialog)
- [x] Validación con Zod y TypeScript sin any
- [x] Validación de fecha límite (no permite fechas pasadas)
- [x] Arrastre de tarjetas sin zoom ni distorsión
- [x] Mínimo 10 commits con mensajes significativos

## Decisiones técnicas
1. El estado principal vive en `BoardData` y se persiste en `localStorage` para evitar usar BDD.
2. La auditoría se genera en `lib/storage.ts` con un diff por campo para que los cambios se entiendan rápido.
3. La búsqueda avanzada se parsea en `lib/query.ts` para separar lógica de UI y evitar filtros “a mano”.
4. La importación valida con Zod y si hay IDs repetidos los regenera y registra un log de auditoría.
5. El Modo Dios se activó con un switch y añade campos extra sin romper el flujo normal del formulario.
6. Se prefirieron componentes Shadcn para mantener consistencia visual y accesibilidad base.
7. La UI muestra estados vacíos claros para no dejar pantallas “muertas”.
8. La fecha límite se valida para no aceptar fechas anteriores a hoy.
9. El drag usa solo traslación para evitar escalado visual de las tarjetas.
