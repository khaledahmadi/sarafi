import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppSelect } from "@/components/site/Field";
import { Skeleton } from "@/components/ui/skeleton";
import { faNum } from "@/lib/site";

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  loading?: boolean;
  toolbar?: ReactNode;
  emptyLabel?: string;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "جست‌وجو…",
  pageSize = 10,
  loading = false,
  toolbar,
  emptyLabel = "موردی یافت نشد.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((current) => ({ ...current, pageIndex: 0 }));
    },
    onPaginationChange: setPagination,
    initialState: {
      columnVisibility: { search: false },
    },
    state: {
      sorting,
      columnFilters,
      pagination,
    },
  });

  const pageCount = Math.max(1, table.getPageCount());
  const pageIndex = table.getState().pagination.pageIndex;
  const currentPageSize = table.getState().pagination.pageSize;

  return (
    <div className="space-y-4">
      {searchKey || toolbar ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          {searchKey ? (
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute top-1/2 end-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) => table.getColumn(searchKey)?.setFilterValue(event.target.value)}
                placeholder={searchPlaceholder}
                className="form-field h-11 w-full rounded-xl pe-10 ps-4 text-sm"
              />
            </label>
          ) : null}
          {toolbar}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="max-h-[min(36rem,calc(100vh-18rem))] overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <TableHeader className="sticky top-0 z-10 bg-card">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-12 px-3 text-start text-xs font-semibold sm:px-4"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <TableRow key={index}>
                    <TableCell colSpan={columns.length} className="px-4 py-3">
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-3 align-top sm:px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 px-4 text-center text-muted-foreground"
                  >
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">تعداد در صفحه</p>
          <AppSelect
            size="sm"
            ariaLabel="تعداد ردیف در صفحه"
            value={String(currentPageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
            options={[10, 25, 50].map((size) => ({
              value: String(size),
              label: faNum(size, 0),
            }))}
            className="w-24"
          />
        </div>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm text-muted-foreground">
            صفحه {faNum(pageIndex + 1, 0)} از {faNum(pageCount, 0)}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              aria-label="صفحه قبل"
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              aria-label="صفحه بعد"
            >
              <ChevronLeft className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
