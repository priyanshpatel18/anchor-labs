"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRpcStore } from "@/stores/rpcStore";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

export interface TxItem {
  signature: string;
  slot: number;
  blockTime?: number | null;
  status: string;
}

interface TransactionTableProps {
  data: TxItem[];
  filter: string;
}

type ExplorerType = "solana" | "solscan" | "solanaFm";

export function getExplorerUrl(
  signature: string,
  explorerType: ExplorerType,
  rpcUrl: string
): string {
  const isMainnet = rpcUrl.includes("mainnet");
  const isDevnet = rpcUrl.includes("devnet");
  const isTestnet = rpcUrl.includes("testnet");

  let cluster = "custom";
  if (isMainnet) cluster = "mainnet-beta";
  else if (isDevnet) cluster = "devnet";
  else if (isTestnet) cluster = "testnet";

  switch (explorerType) {
    case "solscan":
      const solscanCluster = isMainnet ? "" : `?cluster=${cluster}`;
      return `https://solscan.io/tx/${signature}${solscanCluster}`;

    case "solanaFm":
      const fmCluster = isMainnet ? "" : `?cluster=${cluster}-solana`;
      return `https://solana.fm/tx/${signature}${fmCluster}`;

    case "solana":
    default:
      return `https://explorer.solana.com/tx/${signature}?cluster=${cluster}${
        cluster === "custom" ? `&customUrl=${encodeURIComponent(rpcUrl)}` : ""
      }`;
  }
}

export function TransactionTable({ data, filter }: TransactionTableProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [explorer, setExplorer] = useState<ExplorerType>("solana");
  const { getCurrentRpcUrl } = useRpcStore();

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("preferred-explorer") as ExplorerType;
    if (saved) setExplorer(saved);
  }, []);

  const handleExplorerChange = (value: ExplorerType) => {
    setExplorer(value);
    localStorage.setItem("preferred-explorer", value);
  };

  const columns = useMemo<ColumnDef<TxItem>[]>(
    () => [
      {
        id: "signature",
        header: "Signature",
        accessorKey: "signature",
        cell: ({ row }) => {
          const sig = row.getValue("signature") as string;
          const shortSig = `${sig.slice(0, 8)}...${sig.slice(-8)}`;
          return (
            <Link
              href={getExplorerUrl(sig, explorer, getCurrentRpcUrl())}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline underline-offset-4 group"
            >
              <span className="font-mono text-sm">{shortSig}</span>
              <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        },
      },
      {
        id: "slot",
        header: "Slot",
        accessorKey: "slot",
        cell: ({ getValue }) => {
          const slot = getValue() as number;
          return <span className="font-mono text-sm">{slot.toLocaleString()}</span>;
        },
      },
      {
        id: "blockTime",
        header: "Timestamp",
        accessorKey: "blockTime",
        cell: ({ row }) => {
          const blockTime = row.getValue("blockTime") as
            | number
            | undefined
            | null;
          if (!blockTime) return <span className="text-muted-foreground">-</span>;

          const date = new Date(blockTime * 1000);

          if (!isMounted) {
            return <span className="text-sm">{date.toLocaleString()}</span>;
          }

          return <span className="text-sm">{date.toLocaleString()}</span>;
        },
      },
      {
        id: "age",
        header: "Age",
        accessorFn: (row) => row.blockTime,
        cell: ({ row }) => {
          const blockTime = row.getValue("age") as number | undefined | null;
          if (!blockTime) return <span className="text-muted-foreground">-</span>;

          const date = new Date(blockTime * 1000);

          if (!isMounted) {
            return <span className="text-sm text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>;
          }

          return <span className="text-sm text-muted-foreground">{formatDistanceToNow(date, { addSuffix: true })}</span>;
        },
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          const isSuccess = value === "Success";
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isSuccess
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}>
              {value}
            </span>
          );
        },
      },
    ],
    [explorer, getCurrentRpcUrl, isMounted]
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter: filter },
    globalFilterFn: (row, columnId, filterValue) => {
      const v = row.getValue(columnId) as string | number | undefined;
      return String(v).toLowerCase().includes(filterValue.toLowerCase());
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: () => {},
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col rounded-xl border shadow-sm bg-card overflow-hidden"
    >
      {/* Explorer selector header */}
      <div className="px-6 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">
          {table.getFilteredRowModel().rows.length} transaction{table.getFilteredRowModel().rows.length !== 1 ? 's' : ''}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">View on:</span>
          <Select value={explorer} onValueChange={handleExplorerChange}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solana">Solana Explorer</SelectItem>
              <SelectItem value="solscan">Solscan</SelectItem>
              <SelectItem value="solanaFm">Solana FM</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-muted/20 hover:bg-muted/20">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
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
                  colSpan={5}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p className="text-sm font-medium">No transactions found</p>
                    {filter && (
                      <p className="text-xs">Try adjusting your search</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}