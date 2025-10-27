"use client";

import ProgramNotFound from "@/components/ProgramNotFound";
import { Button } from "@/components/ui/button";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Check,
  Code,
  Copy,
  Database,
  Globe,
  LayoutGrid,
  ServerIcon
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedRpc, setCopiedRpc] = useState(false);
  const [showIdl, setShowIdl] = useState(false);
  const [idlCopied, setIdlCopied] = useState(false);
  const { programDetails } = useProgramStore()
  const wallet = useAnchorWallet();
  useAutoReinitialize(wallet);

  const idlJson = programDetails?.serializedIdl
    ? JSON.stringify(JSON.parse(programDetails.serializedIdl), null, 2)
    : "";

  const copyToClipboard = async (
    text: string,
    setter: (value: boolean) => void
  ) => {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  if (!programDetails) {
    return <ProgramNotFound />
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="w-full h-full p-6 lg:p-8 overflow-auto"
    >
      {/* Program Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 15
            }}
            className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 border border-primary/20"
          >
            <Code className="h-7 w-7 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {programDetails.name}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-secondary text-secondary-foreground">
                {programDetails.cluster}
              </span>
              <div className="hidden sm:block w-px h-4 bg-muted"></div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <span>Initialized</span>
                <span
                  className="font-mono"
                  title={new Date(programDetails.initializedAt).toLocaleString()}
                >
                  {formatDistanceToNow(new Date(programDetails.initializedAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Grid - 2x3 layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Program ID Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-2 rounded-lg bg-primary/10"
              >
                <Globe className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-base font-semibold">Program ID</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={() =>
                copyToClipboard(programDetails.programId, setCopiedId)
              }
            >
              <AnimatePresence mode="wait">
                {copiedId ? (
                  <motion.span
                    key="copied"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
          <div className="font-mono text-sm bg-muted rounded-lg p-4 overflow-x-auto whitespace-nowrap mb-4">
            {programDetails.programId}
          </div>
          <button
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors underline"
            onClick={() => setShowIdl((v) => !v)}
          >
            {showIdl ? "Hide IDL" : "View Complete IDL"}
          </button>
          <AnimatePresence>
            {showIdl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 relative overflow-hidden"
              >
                <button
                  className="absolute top-3 right-3 z-10 text-xs bg-background px-3 py-1.5 rounded-md hover:bg-muted border shadow-sm"
                  onClick={async () => {
                    await navigator.clipboard.writeText(idlJson);
                    setIdlCopied(true);
                    setTimeout(() => setIdlCopied(false), 2000);
                  }}
                >
                  {idlCopied ? "Copied" : "Copy"}
                </button>
                <pre className="bg-muted rounded-lg p-5 text-xs font-mono overflow-x-auto max-h-96 border">
                  {idlJson}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* RPC Endpoint Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-2 rounded-lg bg-primary/10"
              >
                <ServerIcon className="h-5 w-5 text-primary" />
              </motion.div>
              <span className="text-base font-semibold">RPC Endpoint</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={() =>
                copyToClipboard(programDetails.rpcUrl, setCopiedRpc)
              }
            >
              <AnimatePresence mode="wait">
                {copiedRpc ? (
                  <motion.span
                    key="copied"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Copied
                  </motion.span>
                ) : (
                  <motion.span
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
          <div className="font-mono text-sm bg-muted rounded-lg p-4 overflow-x-auto whitespace-nowrap">
            {programDetails.rpcUrl}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Commitment Level</span>
              <span className="font-medium">{programDetails.commitment}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network</span>
              <span className="font-medium capitalize">{programDetails.cluster}</span>
            </div>
          </div>
        </motion.div>

        {/* Accounts Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link href="/accounts" className="block group">
            <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all h-full cursor-pointer hover:border-primary/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                  >
                    <LayoutGrid className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">Accounts</h3>
                    <p className="text-sm text-muted-foreground">
                      View and manage program accounts
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Quick Access</div>
                <div className="text-sm font-medium">Browse all program accounts and their data</div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Instructions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/instructions" className="block group">
            <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all h-full cursor-pointer hover:border-primary/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: -5 }}
                    className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                  >
                    <Code className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">Instructions</h3>
                    <p className="text-sm text-muted-foreground">
                      View and execute program instructions
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Quick Access</div>
                <div className="text-sm font-medium">Execute and test program instructions</div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* PDA Derivation Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="xl:col-span-2"
        >
          <Link href="/pda" className="block group">
            <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all h-full cursor-pointer hover:border-primary/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                  >
                    <Database className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="text-base font-semibold mb-1">PDA Derivation</h3>
                    <p className="text-sm text-muted-foreground">
                      Derive program addresses using custom seeds
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">Quick Access</div>
                <div className="text-sm font-medium">
                  Compute PDAs for your Solana program
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Transactions Card - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Link href="/transactions" className="block group">
          <div className="bg-card border rounded-xl p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors"
                >
                  <Database className="h-6 w-6 text-primary" />
                </motion.div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">Transactions</h3>
                  <p className="text-sm text-muted-foreground">
                    View recent transactions and their status
                  </p>
                </div>
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}