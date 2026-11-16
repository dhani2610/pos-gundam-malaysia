"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DeleteConfirmDialog,
  RestoreConfirmDialog,
  PermanentDeleteConfirmDialog,
} from "@/components/ui/delete-confirm-dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Inbox,
  Trash2,
  ArchiveRestore,
  Barcode,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  defaultPageSize?: number;
  rightSlot?: React.ReactNode;
  onBulkDelete?: (selectedItems: TData[]) => Promise<void> | void;
  onBulkRestore?: (selectedItems: TData[]) => Promise<void> | void;
  onBulkPermanentDelete?: (selectedItems: TData[]) => Promise<void> | void;
  onBulkPrintBarcode?: (selectedItems: TData[]) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Type to search records...",
  defaultPageSize = 10,
  rightSlot,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onBulkPrintBarcode,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkRestoreOpen, setBulkRestoreOpen] = React.useState(false);
  const [bulkPermDeleteOpen, setBulkPermDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    setRowSelection({});
  }, [data]);

  const hasBulkSelection = Boolean(
    onBulkDelete ||
      onBulkRestore ||
      onBulkPermanentDelete ||
      onBulkPrintBarcode
  );

  const enhancedColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    const cols: ColumnDef<TData, any>[] = [];

    if (hasBulkSelection) {
      cols.push({
        id: "__select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
            className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
        ),
        enableSorting: false,
      });
    }

    cols.push({
      id: "__row_number",
      header: "No.",
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;
        const pageRows = table.getRowModel().rows;
        const idxInPage = pageRows.findIndex((r) => r.id === row.id);
        const num =
          pageIndex * pageSize + (idxInPage >= 0 ? idxInPage + 1 : row.index + 1);
        return (
          <span className="font-mono text-xs font-bold text-slate-500">
            {num}
          </span>
        );
      },
      enableSorting: false,
    });

    return [...cols, ...columns];
  }, [columns, hasBulkSelection]);

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: defaultPageSize,
      },
    },
    enableRowSelection: hasBulkSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table
    .getFilteredSelectedRowModel()
    .rows.map((r) => r.original);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 bg-white border-blue-200 focus-visible:ring-blue-600"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selectedRows.length > 0 && onBulkPrintBarcode && (
            <Button
              type="button"
              variant="mecha"
              size="sm"
              onClick={() => onBulkPrintBarcode(selectedRows)}
              className="font-bold shadow-sm animate-in fade-in zoom-in-95"
            >
              <Barcode className="h-3.5 w-3.5 mr-1.5" />
              Print Barcodes ({selectedRows.length})
            </Button>
          )}
          {selectedRows.length > 0 && onBulkDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="bg-red-600 hover:bg-red-700 font-bold shadow-sm animate-in fade-in zoom-in-95"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Move Selected ({selectedRows.length}) to Trash
            </Button>
          )}
          {selectedRows.length > 0 && onBulkRestore && (
            <Button
              type="button"
              variant="mecha"
              size="sm"
              onClick={() => setBulkRestoreOpen(true)}
              className="font-bold shadow-sm animate-in fade-in zoom-in-95"
            >
              <ArchiveRestore className="h-3.5 w-3.5 mr-1.5" />
              Restore Selected ({selectedRows.length})
            </Button>
          )}
          {selectedRows.length > 0 && onBulkPermanentDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkPermDeleteOpen(true)}
              className="bg-red-600 hover:bg-red-700 font-bold shadow-sm animate-in fade-in zoom-in-95"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete Selected ({selectedRows.length})
            </Button>
          )}
          {rightSlot}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span>Rows:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="h-9 rounded-lg border border-blue-200 bg-white px-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-blue-50/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-blue-100">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TableHead
                      key={header.id}
                      className="text-blue-950 font-bold"
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={
                            canSort
                              ? "flex items-center gap-1.5 cursor-pointer select-none hover:text-blue-600 transition-colors"
                              : ""
                          }
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-blue-50 hover:bg-blue-50/40 data-[state=selected]:bg-blue-50/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={enhancedColumns.length}
                  className="h-36 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Inbox className="h-8 w-8 text-blue-300" />
                    <span className="text-sm font-medium text-slate-500">
                      No matching records found
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing{" "}
          <span className="font-bold text-slate-800">
            {table.getFilteredRowModel().rows.length === 0
              ? 0
              : table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                1}
          </span>{" "}
          to{" "}
          <span className="font-bold text-slate-800">
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}
          </span>{" "}
          of{" "}
          <span className="font-bold text-slate-800">
            {table.getFilteredRowModel().rows.length}
          </span>{" "}
          entries
          {selectedRows.length > 0 && (
            <span className="ml-2 text-blue-600 font-semibold">
              ({selectedRows.length} selected)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-blue-200"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-blue-200"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-2 font-semibold text-slate-800">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-blue-200"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-blue-200"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {onBulkDelete && (
        <DeleteConfirmDialog
          open={bulkDeleteOpen}
          onOpenChange={setBulkDeleteOpen}
          title={`Move ${selectedRows.length} Selected Item(s) to Trash?`}
          itemName={`${selectedRows.length} selected records`}
          onConfirm={async () => {
            await onBulkDelete(selectedRows);
            setRowSelection({});
          }}
        />
      )}

      {onBulkRestore && (
        <RestoreConfirmDialog
          open={bulkRestoreOpen}
          onOpenChange={setBulkRestoreOpen}
          title={`Restore ${selectedRows.length} Selected Item(s)?`}
          itemName={`${selectedRows.length} selected records`}
          onConfirm={async () => {
            await onBulkRestore(selectedRows);
            setRowSelection({});
          }}
        />
      )}

      {onBulkPermanentDelete && (
        <PermanentDeleteConfirmDialog
          open={bulkPermDeleteOpen}
          onOpenChange={setBulkPermDeleteOpen}
          title={`Permanently Delete ${selectedRows.length} Selected Item(s)?`}
          itemName={`${selectedRows.length} selected records`}
          onConfirm={async () => {
            await onBulkPermanentDelete(selectedRows);
            setRowSelection({});
          }}
        />
      )}
    </div>
  );
}
