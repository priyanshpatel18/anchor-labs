"use client";

import { Input } from "@/components/ui/input";
import useAccountSignatures from "@/hooks/useAccontSignatures";
import useProgramStore from "@/stores/programStore";
import { BitcoinIcon, Loader2, SearchIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TransactionTable = dynamic(
  () =>
    import("@/components/TransactionTable").then(
      (mod) => mod.TransactionTable
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export default function TransactionsPage() {
  const [query, setQuery] = useState("");
  const programId = useProgramStore((state) => state.programDetails?.programId);

  const {
    data: signatures,
    isLoading,
    error,
    isError,
  } = useAccountSignatures({
    address: programId || "",
    enabled: !!programId,
  });

  const transactions =
    signatures?.map((sig) => ({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime,
      err: sig.err,
      memo: sig.memo,
      status: sig.err ? ("Error" as const) : ("Success" as const),
    })) || [];

  if (!programId) {
    return (
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-center text-muted-foreground">
              Please initialize a program first to view transactions.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground"
          >
            Loading transactions...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md"
          >
            <h3 className="font-medium text-destructive mb-2">
              Failed to load transactions
            </h3>
            <p className="text-sm text-muted-foreground">
              {error?.message ||
                "An error occurred while fetching transaction data."}
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-6xl mx-auto p-3 sm:p-4 lg:p-6"
    >
      <div className="space-y-4 sm:space-y-6">
        <motion.div className="space-y-2">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
                delay: 0.1,
              }}
              className="rounded-lg bg-primary/10 p-2"
            >
              <BitcoinIcon className="h-5 w-5 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Transactions
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and search through transaction history for this program
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div className="w-full max-w-2xl">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by signature, slot, or status..."
              className="pl-9 h-11 w-full bg-background border-muted shadow-sm transition-all duration-200 focus:shadow-md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </motion.div>

        <motion.div
          className="w-full"
          layout
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={query}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TransactionTable data={transactions} filter={query.trim()} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}