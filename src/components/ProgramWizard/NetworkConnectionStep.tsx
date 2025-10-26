"use client";

import {
  RPC_ENDPOINTS,
  useRpcStore,
  type RpcOption
} from "@/stores/rpcStore";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Database,
  Loader2,
  ServerIcon,
  Wallet,
  XCircle,
} from "lucide-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface NetworkConnectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function NetworkConnectionStep({
  onNext,
  onBack,
}: NetworkConnectionStepProps) {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const {
    selectedRpc,
    setSelectedRpc,
    customRpcUrl,
    setCustomRpcUrl,
    getCurrentRpcUrl,
    getCurrentRpcDisplayName,
  } = useRpcStore();

  const [isCustomRpcMode, setIsCustomRpcMode] = useState(
    selectedRpc === "custom"
  );
  const [customRpcInput, setCustomRpcInput] = useState(customRpcUrl);
  const [rpcHealth, setRpcHealth] = useState<"healthy" | "unhealthy" | "checking" | null>(null);

  const handleRpcSelection = async (value: RpcOption | "custom") => {
    if (value === "custom") {
      setIsCustomRpcMode(true);
      setSelectedRpc("custom");
      setRpcHealth(null);
    } else {
      setIsCustomRpcMode(false);
      setSelectedRpc(value as RpcOption);
      setRpcHealth("checking");
      const isHealthy = await checkRpcHealth(RPC_ENDPOINTS.find(r => r.value === value)?.url || "");
      setRpcHealth(isHealthy ? "healthy" : "unhealthy");
    }
  };

  const handleCustomRpcSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (customRpcInput.trim()) {
      setRpcHealth("checking");
      const isHealthy = await checkRpcHealth(customRpcInput.trim());
      if (isHealthy) {
        setCustomRpcUrl(customRpcInput.trim());
        setSelectedRpc("custom");
        setRpcHealth("healthy");
      } else {
        setRpcHealth("unhealthy");
      }
    }
  };

  const checkRpcHealth = async (url: string) => {
    try {
      // Try getHealth first
      const healthRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getHealth" }),
      });
      const healthData = await healthRes.json();
      if (healthData?.result === "ok") return true;

      // Fallback: getVersion (always supported)
      const versionRes = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getVersion" }),
      });
      const versionData = await versionRes.json();
      return !!versionData?.result?.["solana-core"];
    } catch {
      return false;
    }
  };

  useEffect(() => {
    const check = async () => {
      setRpcHealth("checking");
      const healthy = await checkRpcHealth(getCurrentRpcUrl());
      setRpcHealth(healthy ? "healthy" : "unhealthy");
    };
    check();
  }, [selectedRpc, customRpcUrl]);

  // Helper function to get health status display
  const getHealthStatusDisplay = () => {
    switch (rpcHealth) {
      case "checking":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />,
          text: "Checking...",
          bgColor: "bg-blue-50 dark:bg-blue-950/20",
          borderColor: "border-blue-200 dark:border-blue-900/30",
          textColor: "text-blue-700 dark:text-blue-400"
        };
      case "healthy":
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
          text: "Connected",
          bgColor: "bg-green-50 dark:bg-green-950/20",
          borderColor: "border-green-200 dark:border-green-900/30",
          textColor: "text-green-700 dark:text-green-400"
        };
      case "unhealthy":
        return {
          icon: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
          text: "Connection Failed",
          bgColor: "bg-red-50 dark:bg-red-950/20",
          borderColor: "border-red-200 dark:border-red-900/30",
          textColor: "text-red-700 dark:text-red-400"
        };
      default:
        return null;
    }
  };

  const healthStatus = getHealthStatusDisplay();

  return (
    <div className="flex h-full w-full flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          Network Connection Setup
        </h2>
        <p className="text-muted-foreground">
          Configure RPC endpoint and connect your wallet
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* RPC Endpoint Configuration Card */}
        <div className="overflow-hidden rounded-lg border bg-card/50 shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <ServerIcon className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">RPC Endpoint</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Solana network endpoint for blockchain interaction
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {getCurrentRpcDisplayName()}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getCurrentRpcUrl()}
                    </div>
                  </div>
                </div>

                {/* RPC Health Status Display */}
                {healthStatus && (
                  <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${healthStatus.bgColor} ${healthStatus.borderColor}`}>
                    {healthStatus.icon}
                    <span className={`text-sm font-medium ${healthStatus.textColor}`}>
                      {healthStatus.text}
                    </span>
                  </div>
                )}

                {/* Additional info for unhealthy state */}
                {rpcHealth === "unhealthy" && (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-3 rounded-md border border-red-200 dark:border-red-900/30">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Unable to connect to this RPC endpoint. Please try a different endpoint or check your network connection.
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-3 mt-4">
                <label htmlFor="rpc-selector" className="text-sm font-medium">
                  Select RPC Endpoint
                </label>
                <Select value={selectedRpc} onValueChange={handleRpcSelection}>
                  <SelectTrigger id="rpc-selector" className="w-full">
                    <SelectValue placeholder="Choose an RPC endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    {RPC_ENDPOINTS.map((rpc) => (
                      <SelectItem key={rpc.value} value={rpc.value}>
                        {rpc.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom RPC URL</SelectItem>
                  </SelectContent>
                </Select>

                {selectedRpc === "mainnet-beta" && (
                  <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Default mainnet RPC may have rate limits. Consider using a
                      custom RPC provider for production applications.
                    </span>
                  </div>
                )}

                {!isCustomRpcMode && selectedRpc !== "mainnet-beta" && (
                  <p className="text-xs text-muted-foreground px-1">
                    Select &quot;Custom RPC URL&quot; to use your own endpoint
                  </p>
                )}

                {isCustomRpcMode && (
                  <form
                    onSubmit={handleCustomRpcSave}
                    className="flex gap-2 mt-3"
                  >
                    <input
                      type="url"
                      value={customRpcInput}
                      onChange={(e) => setCustomRpcInput(e.target.value)}
                      placeholder="https://api.mainnet-beta.solana.com"
                      className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      autoFocus
                      required
                    />
                    <Button
                      type="submit"
                      size="sm"
                      className="h-10"
                      disabled={!customRpcInput.trim()}
                    >
                      Apply
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Card */}
        <div className="overflow-hidden rounded-lg border bg-card/50 shadow-sm">
          <div className="border-b bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium">Wallet Connection</h3>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect wallet to sign transactions
            </p>
          </div>
          <div className="p-6">
            {publicKey ? (
              <div className="flex flex-col gap-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900/30 dark:bg-green-900/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-green-800 dark:text-green-400">
                      Wallet Connected
                    </div>
                    <div className="text-xs font-mono text-green-700/70 dark:text-green-500/70 truncate">
                      {publicKey.toString().slice(0, 8)}...
                      {publicKey.toString().slice(-8)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--muted)]">
                    <Wallet className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <div className="font-medium text-[var(--foreground)]">
                      No Wallet Connected
                    </div>
                    <div className="text-xs text-[var(--muted-foreground)]">
                      Connect your wallet to proceed
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setVisible(true)}
                  className="
                    w-full 
                    border-[var(--border)]
                    bg-[var(--muted)]
                    hover:bg-[var(--accent)]
                    text-[var(--foreground)]
                    transition-colors
                    solana:bg-[var(--primary-gradient)]
                    solana:text-[var(--primary-foreground)]
                    solana:hover:bg-[var(--primary-gradient-hover)]
                  "
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="mt-8 flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          direction="backward"
          className="min-w-[120px]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!publicKey || rpcHealth !== "healthy"}
          className="min-w-[120px]"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}