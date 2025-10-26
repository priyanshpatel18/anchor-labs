"use client";

import ProgramInitializationWizard from "@/components/ProgramWizard/ProgramInitializationWizard";
import WalletConnectionPrompt from "@/components/WalletConnectionPrompt";
import WelcomeAnimation from "@/components/WelcomeAnimation";
import { Spinner } from "@/components/ui/8bit/spinner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { IconCheck, IconRocket, IconSettings } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const {
    isInitialized,
    program,
    programDetails,
    reset,
    isReinitializing,
  } = useProgramStore();
  const router = useRouter();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useAutoReinitialize(wallet ?? undefined);

  if (loading) {
    return <WelcomeAnimation />;
  }

  // CASE 0: Program is currently reinitializing → show loader
  if (isReinitializing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
        <Spinner className="size-20" />
        <p className="text-sm text-muted-foreground">
          Initializing program...
        </p>
      </div>
    );
  }

  // CASE 1: No saved programDetails → show setup wizard
  if (!programDetails) {
    return (
      <div className="flex flex-1 flex-col">
        <ProgramInitializationWizard onComplete={() => { }} />
      </div>
    );
  }

  // CASE 2: Have programDetails but not yet initialized → show wallet connect prompt
  if (!program || !isInitialized) {
    return (
      <div className="flex flex-1 flex-col p-3 sm:p-4 lg:p-6">
        <WalletConnectionPrompt />
      </div>
    );
  }

  // CASE 3: Program fully initialized and ready
  return (
    <div className="w-full h-screen flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <IconCheck className="size-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Program Ready!</CardTitle>
          <CardDescription className="text-base">
            Your Anchor program is initialized and ready to test
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Program Details */}
          <div className="space-y-3 rounded-lg bg-muted/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Program Name
                </p>
                <p className="font-semibold">{programDetails.name}</p>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Program ID
                </p>
                <p className="font-mono text-sm">
                  {programDetails.programId}
                </p>
              </div>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  RPC Endpoint
                </p>
                <p className="text-sm">{programDetails.rpcUrl}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              <IconRocket className="mr-2 size-5" />
              Go to Dashboard
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (
                  confirm(
                    "Are you sure you want to reconfigure? This will reset your current setup."
                  )
                ) {
                  reset();
                }
              }}
            >
              <IconSettings className="mr-2 size-5" />
              Reconfigure
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-center text-xs text-muted-foreground">
            You can reconfigure your program settings at any time from the
            dashboard
          </p>
        </CardContent>
      </Card>
    </div>
  );
}