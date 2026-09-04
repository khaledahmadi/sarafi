import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

/**
 * Actions header/cell alignment — physical right so content reads from the right
 * in Dari/Pashto and sits on the right in English.
 */
export const ACTIONS_COLUMN_ALIGN = "text-right";

/**
 * Action buttons aligned to the physical right of the cell.
 * `direction:ltr` keeps flex `justify-end` on the right under RTL document direction.
 * `flex-nowrap` keeps Edit/Delete on one line.
 */
export const ACTIONS_CELL_CONTENT =
  "flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap [direction:ltr]";

export function isActionsColumn<TData, TValue>(
  column: ColumnDef<TData, TValue> | { id?: string },
): boolean {
  return column.id === "actions";
}

/**
 * Keep Actions as the last column in DOM order.
 * LTR → visual right. RTL (Dari/Pashto) → visual left.
 */
export function pinActionsColumn<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
): ColumnDef<TData, TValue>[] {
  const actions = columns.filter((column) => isActionsColumn(column));
  if (actions.length === 0) return columns;
  const rest = columns.filter((column) => !isActionsColumn(column));
  return [...rest, ...actions];
}

/** @deprecated Use pinActionsColumn — kept for call-site compatibility. */
export function pinActionsToVisualRight<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  _dir?: "rtl" | "ltr",
): ColumnDef<TData, TValue>[] {
  return pinActionsColumn(columns);
}

export function actionsHeaderClassName(extra?: string) {
  return cn("h-12 px-3 text-xs font-semibold sm:px-4", ACTIONS_COLUMN_ALIGN, extra);
}

export function actionsCellClassName(extra?: string) {
  return cn("px-3 py-3 align-top sm:px-4", ACTIONS_COLUMN_ALIGN, extra);
}
