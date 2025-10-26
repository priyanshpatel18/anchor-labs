"use client";

import React from "react";
import { useJsonStore } from "@/stores/jsonStore";
import useProgramStore from "@/stores/programStore";
import { useRpcStore } from "@/stores/rpcStore";
import { toast } from "sonner";
// import { ProgramDetails } from "@/components/dashboard/program-details";
import {
  ArrowLeft,
  Database,
  FileJson,
  ServerIcon,
  Wallet,
  CheckCircle2,
  Code2,
  Layers,
} from "lucide-react";
import { Button } from "../ui/button";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";

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
      <div className="flex h-full w-full flex-col">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Initialization Complete
          </h2>
          <p className="text-muted-foreground">
            Your program has been successfully initialized
          </p>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-medium text-green-800 dark:text-green-400">
                  Initialization Successful
                </div>
                <div className="text-sm text-green-700/70 dark:text-green-500/70">
                  Your program is configured and ready for use
                </div>
              </div>
            </div>
          </div>

          {/* <ProgramDetails
            programDetails={programDetails}
            onReinitialize={() => {}}
          /> */}

          <div className="overflow-hidden rounded-lg border bg-card/50 shadow-sm">
            <div className="border-b bg-muted/30 px-6 py-4">
              <h3 className="text-lg font-medium">Available Actions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Explore program capabilities and start interacting
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mr-3">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">View Accounts</div>
                    <div className="text-xs text-muted-foreground">
                      Explore and query program accounts
                    </div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start h-auto py-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mr-3">
                    <Code2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">Execute Instructions</div>
                    <div className="text-xs text-muted-foreground">
                      Call program methods and view responses
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onComplete}
              size="lg"
              className="min-w-[160px]"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Review Configuration
        </h2>
        <p className="text-muted-foreground">
          Review your settings before initializing the program
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* IDL Configuration Summary */}
          <div className="overflow-hidden rounded-lg border bg-card/50 shadow-sm">
            <div className="border-b bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileJson className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">IDL Configuration</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="rounded-lg border bg-muted/20 p-4">
                <pre className="max-h-[200px] overflow-auto text-xs scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
                  {JSON.stringify(JSON.parse(jsonData), null, 2).slice(0, 300)}
                  ...
                </pre>
              </div>
            </div>
          </div>

          {/* Network Configuration Summary */}
          <div className="overflow-hidden rounded-lg border bg-card/50 shadow-sm">
            <div className="border-b bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium">Network Configuration</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <ServerIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-muted-foreground">
                      RPC Endpoint
                    </div>
                    <div className="font-medium truncate">
                      {getCurrentRpcDisplayName()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-lg border bg-muted/20 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
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
        </div>
      </div>
    </div>
  );
}