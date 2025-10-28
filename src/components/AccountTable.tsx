"use client";

import { useMemo, useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Copy,
  Check,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { IdlField, IdlTypeDef } from "@coral-xyz/anchor/dist/cjs/idl";
import { motion, AnimatePresence } from "framer-motion";

// Copy button component with improved styling
const CopyButton = ({
  text,
  alwaysVisible = false,
  className,
}: {
  text: string;
  alwaysVisible?: boolean;
  className?: string;
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all",
        !alwaysVisible && "opacity-0 group-hover:opacity-100",
        copied && "text-green-600",
        className
      )}
      onClick={copyToClipboard}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="sr-only">Copy</span>
    </Button>
  );
};

// Helper function to format enum values
const formatEnumValue = (value: unknown): string => {
  if (typeof value === "object" && value !== null) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const enumKey = keys[0];
      const enumValue = (value as Record<string, unknown>)[enumKey];
      
      // If the enum value is an empty object, just return the key
      if (typeof enumValue === "object" && enumValue !== null && Object.keys(enumValue).length === 0) {
        return enumKey;
      }
      
      // If there's a nested value, format it
      return `${enumKey}: ${JSON.stringify(enumValue)}`;
    }
  }
  return String(value);
};

export type AccountData = {
  publicKey: string;
  account: Record<string, unknown>;
};

interface AccountTableProps {
  data: AccountData[];
  accountType?: IdlTypeDef;
}

export function AccountTable({ data, accountType }: AccountTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<AccountData>[]>(() => {
    const baseColumns: ColumnDef<AccountData>[] = [
      {
        id: "publicKey",
        header: "Public Key",
        accessorKey: "publicKey",
        cell: ({ row }) => {
          const value = row.getValue("publicKey") as string;
          const shortValue = `${value.slice(0, 4)}...${value.slice(-4)}`;
          return (
            <div className="flex items-center gap-2 group">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-mono text-sm font-medium cursor-help">
                      {shortValue}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-mono text-xs max-w-xs break-all">
                    {value}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <CopyButton text={value} />
            </div>
          );
        },
      },
    ];

    function isIdlField(field: unknown): field is IdlField {
      const possibleField = field as { name?: unknown; type?: unknown } | null;

      return (
        typeof possibleField === "object" &&
        possibleField !== null &&
        typeof possibleField.name === "string" &&
        "type" in possibleField
      );
    }

    const accountFields: IdlField[] =
      accountType &&
        accountType.type &&
        accountType.type.kind === "struct" &&
        Array.isArray(accountType.type.fields)
        ? (accountType.type.fields as unknown[]).filter(isIdlField)
        : [];

    const dynamicColumns: ColumnDef<AccountData>[] = accountFields.map(
      (field) => {
        const fieldType = typeof field.type === "string" ? field.type : "";
        return {
          id: field.name,
          header: field.name.charAt(0).toUpperCase() + field.name.slice(1),
          accessorFn: (row) => {
            const value = row.account[field.name];
            switch (fieldType) {
              case "pubkey":
                return value?.toString() || "";
              case "u64":
              case "u32":
              case "u16":
              case "u8":
              case "i64":
              case "i32":
              case "i16":
              case "i8":
                return value ? value.toString() : "0";
              case "bool":
                return value ? "Yes" : "No";
              default:
                // Check if it's an enum (object with single key and empty object value)
                if (typeof value === "object" && value !== null) {
                  const keys = Object.keys(value);
                  if (keys.length === 1) {
                    return formatEnumValue(value);
                  }
                }
                return value;
            }
          },
          cell: ({ getValue }) => {
            const value = getValue();
            
            // Check if this is an enum value
            const rawValue = typeof value === "string" && value.includes(": ") 
              ? value.split(": ")[0] 
              : value;
            
            const displayValue =
              typeof value === "object" && value !== null
                ? JSON.stringify(value, null, 2)
                : String(value ?? "");

            if (fieldType === "pubkey") {
              const shortValue = displayValue.length > 16
                ? `${displayValue.slice(0, 6)}...${displayValue.slice(-6)}`
                : displayValue;
              return (
                <div className="flex items-center gap-2 group">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-mono text-sm cursor-help">
                          {shortValue}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="font-mono text-xs max-w-xs break-all">
                        {displayValue}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <CopyButton text={displayValue} />
                </div>
              );
            }

            if (displayValue.length > 50) {
              return (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="max-w-[200px] truncate cursor-pointer hover:text-foreground transition-colors">
                        {displayValue}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      className="border-none bg-transparent p-0 shadow-none"
                      side="bottom"
                      align="start"
                    >
                      <div className="relative max-w-sm rounded-lg border bg-popover text-popover-foreground shadow-lg">
                        <div className="absolute top-2 right-2 z-10">
                          <CopyButton
                            text={displayValue}
                            alwaysVisible
                            className="hover:bg-muted/80"
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto p-4 pr-12">
                          <pre className="text-xs whitespace-pre-wrap break-all font-mono">
                            {displayValue}
                          </pre>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }

            return (
              <div className="max-w-[200px] truncate">
                {displayValue}
              </div>
            );
          },
        };
      }
    );

    return [...baseColumns, ...dynamicColumns];
  }, [accountType]);

  const globalFilterFn = (
    row: { getValue: (id: string) => unknown },
    columnId: string,
    filterValue: string
  ) => {
    const value = row.getValue(columnId);
    if (!filterValue) return true;
    const search = filterValue.toLowerCase();

    if (typeof value === "string" && value.toLowerCase().includes(search)) {
      return true;
    }
    if (typeof value === "number" && value.toString().includes(search)) {
      return true;
    }
    if (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      JSON.stringify(value).toLowerCase().includes(search)
    ) {
      return true;
    }
    return false;
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn,
    autoResetPageIndex: false,
  });

  if (!accountType) {
    return <div>No account type specified</div>;
  }

  const totalAccounts = table.getFilteredRowModel().rows.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col rounded-xl border shadow-sm bg-card overflow-hidden"
    >
      {/* Enhanced header with stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 border-b bg-muted/30"
      >
        <div className="flex-1">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${accountType?.name || "accounts"}...`}
              className="pl-10 h-10 bg-background border-input shadow-sm focus-visible:ring-2 transition-shadow duration-200"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center gap-3"
        >
          <div className="flex items-center gap-2 text-sm">
            <div className="rounded-md bg-primary/10 px-3 py-1.5">
              <span className="font-semibold text-primary">{totalAccounts}</span>
              <span className="text-muted-foreground ml-1.5">
                {totalAccounts === 1 ? "account" : "accounts"}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b bg-muted/20 hover:bg-muted/20"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className={cn(
                          "flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors group"
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (
                            header.column.getCanSort() &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={header.column.getCanSort() ? 0 : undefined}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        <div className="flex flex-col">
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="h-4 w-4 text-foreground"
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="h-4 w-4 text-foreground"
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? (
                              <div className="h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity">
                                <ChevronUpIcon className="h-4 w-4" />
                              </div>
                            )}
                        </div>
                      </div>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ 
                      duration: 0.2,
                      delay: Math.min(index * 0.03, 0.3)
                    }}
                    layout
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                    >
                      <FileText className="h-8 w-8 opacity-50" />
                      <p className="text-sm font-medium">No accounts found</p>
                      {globalFilter && (
                        <p className="text-xs">Try adjusting your search</p>
                      )}
                    </motion.div>
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Enhanced pagination */}
      {table.getPageCount() > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-muted/20"
        >
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{table.getState().pagination.pageIndex + 1}</span> of{" "}
              <span className="font-medium text-foreground">{table.getPageCount()}</span>
            </div>
            <Select
              value={table.getState().pagination.pageSize.toString()}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-9 w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50, 100].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}