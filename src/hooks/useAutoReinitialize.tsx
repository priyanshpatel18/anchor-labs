"use client";

import { useEffect } from "react";
import { AnchorWallet } from "@jup-ag/wallet-adapter";
import useProgramStore from "@/stores/programStore";

/**
 * Hook to automatically reinitialize the program if needed.
 *
 * @param wallet - Current connected wallet
 */
export function useAutoReinitialize(wallet: AnchorWallet | undefined) {
  const { programDetails, program, isReinitializing, reinitialize, reset } = useProgramStore();

  useEffect(() => {
    const tryReinit = async () => {
      if (!wallet || !programDetails || program || isReinitializing) return;

      try {
        console.log("↻ Attempting program reinitialization...");
        await reinitialize(wallet);
      } catch (err) {
        console.error("Reinit failed:", err);
        reset();
      }
    };

    tryReinit();
  }, [wallet, programDetails, program, isReinitializing, reinitialize, reset]);
}
