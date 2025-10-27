"use client";

import { useJsonStore } from "@/stores/jsonStore";
import useProgramStore from "@/stores/programStore";
import { useRpcStore } from "@/stores/rpcStore";
import { toast } from "sonner";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import {
  ArrowLeft,
  CheckCircle2,
  Code2,
  Database,
  FileJson,
  Layers,
  ServerIcon,
  Wallet,
} from "lucide-react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface InitializationReviewStepProps {
  onBack: () => void;
  onComplete?: () => void;
}

export default function InitializationReviewStep({
  onBack,
  onComplete,
}: InitializationReviewStepProps) {
  const { jsonData, isValid, reset: resetJsonStore } = useJsonStore();
  const { initialize, isInitialized, programDetails } = useProgramStore();
  const { getCurrentRpcUrl, getCurrentRpcDisplayName } = useRpcStore();
  const wallet = useAnchorWallet();

  const handleInitialization = async () => {
    if (!jsonData.trim()) {
      toast.error("Configuration incomplete", {
        description: "IDL data is missing. Please go back and configure it.",
        duration: 3000,
      });
      return;
    }

    if (!wallet?.publicKey) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to initialize the program.",
        duration: 3000,
      });
      return;
    }

    toast.loading("Initializing program...", { id: "initialize-program" });

    try {
      const parsedIdl = JSON.parse(jsonData);
      const rpcUrl = getCurrentRpcUrl();

      await initialize(parsedIdl, rpcUrl, wallet);

      toast.success("Program initialized", {
        id: "initialize-program",
        description: "Your program is now ready for interaction.",
        duration: 5000,
      });

      resetJsonStore();

      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Program initialization failed:", error);
      toast.error("Initialization failed", {
        id: "initialize-program",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during initialization.",
        duration: 4000,
      });
    }
  };

  if (isInitialized && programDetails) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex h-full w-full flex-col"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-semibold tracking-tight">
            Initialization Complete
          </h2>
          <p className="text-muted-foreground">
            Your program has been successfully initialized
          </p>
        </motion.div>

        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10"
          >
            <div className="flex items-center gap-3">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 15 }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
              >
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </motion.div>
              <div>
                <div className="text-lg font-medium text-green-800 dark:text-green-400">
                  Initialization Successful
                </div>
                <div className="text-sm text-green-700/70 dark:text-green-500/70">
                  Your program is configured and ready for use
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="overflow-hidden rounded-lg border bg-card/50 shadow-sm"
          >
            <div className="border-b bg-muted/30 px-6 py-4">
              <h3 className="text-lg font-medium">Available Actions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore program capabilities and start interacting
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mr-3"
                    >
                      <Layers className="h-4 w-4 text-primary" />
                    </motion.div>
                    <div className="text-left">
                      <div className="font-medium">View Accounts</div>
                      <div className="text-xs text-muted-foreground">
                        Explore and query program accounts
                      </div>
                    </div>
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mr-3"
                    >
                      <Code2 className="h-4 w-4 text-primary" />
                    </motion.div>
                    <div className="text-left">
                      <div className="font-medium">Execute Instructions</div>
                      <div className="text-xs text-muted-foreground">
                        Call program methods and view responses
                      </div>
                    </div>
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-end"
          >
            <Button
              onClick={onComplete}
              size="lg"
              className="min-w-[160px]"
            >
              Go to Dashboard
            </Button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex h-full w-full flex-col"
    >
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          Review Configuration
        </h2>
        <p className="text-muted-foreground">
          Review your settings before initializing the program
        </p>
      </motion.div>

      <div className="space-y-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2"
        >
          {/* IDL Configuration Summary */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="overflow-hidden rounded-lg border bg-card/50 shadow-sm"
          >
            <div className="border-b bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">IDL Configuration</h3>
              </div>
            </div>
            <div className="p-6">
              <motion.div 
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="rounded-lg border bg-muted/20 p-4"
              >
                <pre className="max-h-[200px] overflow-auto text-xs scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
                  {JSON.stringify(JSON.parse(jsonData), null, 2).slice(0, 300)}
                  ...
                </pre>
              </motion.div>
            </div>
          </motion.div>

          {/* Network Configuration Summary */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="overflow-hidden rounded-lg border bg-card/50 shadow-sm"
          >
            <div className="border-b bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Network Configuration</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                  >
                    <ServerIcon className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">
                      RPC Endpoint
                    </div>
                    <div className="font-medium truncate">
                      {getCurrentRpcDisplayName()}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
                  >
                    <Wallet className="h-5 w-5 text-primary" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">
                      Connected Wallet
                    </div>
                    <div className="font-medium font-mono truncate">
                      {wallet?.publicKey
                        ? `${wallet.publicKey.toString().slice(0, 8)}...${wallet.publicKey.toString().slice(-8)}`
                        : "Not connected"}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex justify-between"
        >
          <Button
            variant="outline"
            onClick={onBack}
            className="min-w-[120px]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={handleInitialization}
            disabled={!isValid || !jsonData.trim() || !wallet?.publicKey}
            size="lg"
            className="gap-2 min-w-[160px]"
          >
            <Database className="h-5 w-5" />
            Initialize Program
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}