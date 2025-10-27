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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { IconCheck, IconRocket, IconSettings } from "@tabler/icons-react";
import { motion } from "framer-motion";
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
  const [showResetDialog, setShowResetDialog] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useAutoReinitialize(wallet ?? undefined);

  const handleReset = () => {
    reset();
    setShowResetDialog(false);
  };

  if (loading) {
    return <WelcomeAnimation />;
  }

  // CASE 0: Program is currently reinitializing → show loader
  if (isReinitializing) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Spinner className="size-20" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <p className="text-lg font-medium">Initializing program...</p>
          <p className="text-sm text-muted-foreground">
            This will only take a moment
          </p>
        </motion.div>
      </div>
    );
  }

  // CASE 1: No saved programDetails → show setup wizard
  if (!programDetails) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col"
      >
        <ProgramInitializationWizard onComplete={() => {}} />
      </motion.div>
    );
  }

  // CASE 2: Have programDetails but not yet initialized → show wallet connect prompt
  if (!program || !isInitialized) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-1 flex-col p-3 sm:p-4 lg:p-6"
      >
        <WalletConnectionPrompt />
      </motion.div>
    );
  }

  // CASE 3: Program fully initialized and ready
  return (
    <>
      <div className="w-full h-screen flex flex-1 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl"
        >
          <Card className="w-full">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.2 
                }}
                className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
              >
                <IconCheck className="size-8 text-green-600 dark:text-green-400" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <CardTitle className="text-2xl">Program Ready!</CardTitle>
                <CardDescription className="text-base">
                  Your Anchor program is initialized and ready to test
                </CardDescription>
              </motion.div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Program Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-3 rounded-lg bg-muted/50 p-4"
              >
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Program Name
                    </p>
                    <p className="font-semibold">{programDetails.name}</p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Program ID
                    </p>
                    <p className="font-mono text-sm">
                      {programDetails.programId}
                    </p>
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      RPC Endpoint
                    </p>
                    <p className="text-sm">{programDetails.rpcUrl}</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col gap-3 sm:flex-row"
              >
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
                  onClick={() => setShowResetDialog(true)}
                >
                  <IconSettings className="mr-2 size-5" />
                  Reconfigure
                </Button>
              </motion.div>

              {/* Info Note */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-center text-xs text-muted-foreground"
              >
                You can reconfigure your program settings at any time from the
                dashboard
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reconfigure Program?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset your current program setup. You&lsquo;ll need to initialize a new program or reconnect to an existing one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}