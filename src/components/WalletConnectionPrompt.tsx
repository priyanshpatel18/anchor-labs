"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Wallet, RefreshCw, Settings2, ExternalLink, AlertCircle, Zap, CheckCircle2, XCircle } from "lucide-react";
import useProgramStore from "@/stores/programStore";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { CopyButton } from "@/components/ui/copy-button";

export default function WalletReconnectPrompt() {
  const { programDetails, reset } = useProgramStore();
  const { connecting, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const isWalletConnected = !!publicKey;
  const hasConfigDetails = !!programDetails;

  const handleConnect = async () => {
    try {
      setVisible(true);
    } catch (error) {
      console.error("Failed to open wallet modal:", error);
      toast.error("Failed to open wallet modal", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  const handleResetProgram = () => {
    reset();
  };

  const getClusterConfig = (cluster: string) => {
    switch (cluster) {
      case "mainnet-beta":
        return {
          color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
          label: "Mainnet",
        };
      case "devnet":
        return {
          color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
          label: "Devnet",
        };
      case "localnet":
        return {
          color: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
          label: "Localnet",
        };
      default:
        return {
          color: "bg-muted text-muted-foreground border-border",
          label: cluster,
        };
    }
  };

  const clusterConfig = programDetails ? getClusterConfig(programDetails.cluster) : null;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-12rem)] p-4">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader className="space-y-4 pb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-2 ${
                !hasConfigDetails 
                  ? "bg-red-500/10 ring-red-500/20" 
                  : "bg-orange-500/10 ring-orange-500/20"
              }`}>
                {!hasConfigDetails ? (
                  <XCircle className="h-7 w-7 text-red-600 dark:text-red-500" />
                ) : (
                  <Zap className="h-7 w-7 text-orange-600 dark:text-orange-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">
                  {!hasConfigDetails ? "Configuration Missing" : "Program Initialization Required"}
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  {!hasConfigDetails 
                    ? "Unable to initialize program without configuration"
                    : "Connect your wallet to initialize program interaction"
                  }
                </CardDescription>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          {!hasConfigDetails ? (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-200">
                    No Configuration Found
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-300">
                    We apologize, but the program configuration data has been lost. This includes critical information 
                    like the Program ID, IDL, and RPC endpoint. You&lsquo;ll need to start fresh and reconfigure your program setup.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/20 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
                    Program Instance Lost
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    The program object needed for blockchain interaction has been lost. This happens when the wallet disconnects, 
                    the page is refreshed, or the session expires. Your configuration is safe—just connect your wallet to reinitialize.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6 pb-8">
          {/* Wallet Status */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Connection Status
            </h4>
            <div className={`rounded-lg border p-4 ${
              isWalletConnected 
                ? "border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20"
                : "border-yellow-200 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-950/20"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  isWalletConnected 
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}>
                  {isWalletConnected ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Wallet className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    isWalletConnected 
                      ? "text-green-800 dark:text-green-400"
                      : "text-yellow-800 dark:text-yellow-400"
                  }`}>
                    {isWalletConnected ? "Wallet Connected" : "Wallet Not Connected"}
                  </div>
                  {isWalletConnected ? (
                    <div className="text-xs font-mono text-green-700/70 dark:text-green-500/70 truncate">
                      {publicKey.toString().slice(0, 8)}...{publicKey.toString().slice(-8)}
                    </div>
                  ) : (
                    <div className="text-xs text-yellow-700/70 dark:text-yellow-500/70">
                      Connect your wallet to proceed
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {programDetails && (
            <>
              {/* Current Configuration */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Saved Configuration
                </h4>
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <h3 className="font-semibold text-lg tracking-tight">
                        {programDetails.name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                        Configured{" "}
                        {formatDistanceToNow(
                          new Date(programDetails.initializedAt),
                          { addSuffix: true }
                        )}
                      </p>
                    </div>
                    {clusterConfig && (
                      <Badge
                        variant="outline"
                        className={`${clusterConfig.color} font-medium px-3 py-1`}
                      >
                        {clusterConfig.label}
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Program Details Grid */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Program ID
                        </label>
                        <CopyButton
                          value={programDetails.programId}
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 -mr-2"
                        />
                      </div>
                      <div className="font-mono text-sm bg-muted/50 rounded-lg px-3 py-2.5 break-all border">
                        {programDetails.programId}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          RPC Endpoint
                        </label>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            asChild
                          >
                            <a
                              href={programDetails.rpcUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                          <CopyButton
                            value={programDetails.rpcUrl}
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                          />
                        </div>
                      </div>
                      <div className="font-mono text-sm bg-muted/50 rounded-lg px-3 py-2.5 break-all border">
                        {programDetails.rpcUrl}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* What Happens Next - Only show if has config */}
          {hasConfigDetails && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20 p-4">
              <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                What happens when you connect?
              </h5>
              <ul className="space-y-1.5 text-sm text-blue-800 dark:text-blue-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>Your wallet will be connected to the application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>The program instance will be initialized using your saved configuration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>You&lsquo;ll be able to interact with the Solana program on the blockchain</span>
                </li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {!isWalletConnected ? (
              <Button
                onClick={handleConnect}
                className="w-full h-12 text-base font-semibold"
                size="lg"
                disabled={connecting}
              >
                {connecting ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-5 w-5" />
                    Connect Wallet
                  </>
                )}
              </Button>
            ) : (
              <Button
                className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-600 cursor-default"
                size="lg"
                disabled
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Wallet Connected
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleResetProgram}
              className="w-full h-10 font-medium"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              {hasConfigDetails ? "Start Fresh with New Configuration" : "Configure Program Setup"}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-muted-foreground pt-2">
            {hasConfigDetails && isWalletConnected && (
              "Initialization in progress. Please wait..."
            )}
            {hasConfigDetails && !isWalletConnected && (
              "Your configuration is saved. Connect your wallet to continue."
            )}
            {!hasConfigDetails && (
              "Click the button above to set up your program configuration."
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}