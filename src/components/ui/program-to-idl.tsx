"use client";

import { useJsonStore } from "@/stores/jsonStore";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { Idl, Program } from "@coral-xyz/anchor";
import { useAnchorProvider } from "../Providers/SolanaProvider";
import { Input } from "../ui/input";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";
import { IdlInputMethod } from "../ProgramWizard/wizard.types";

export default function ProgramToIdl({
  setInputMethod,
}: {
  setInputMethod: React.Dispatch<React.SetStateAction<IdlInputMethod>>;
}) {
  const { setJsonData } = useJsonStore();

  const [programAddress, setProgramAddress] = useState("");

  const provider = useAnchorProvider();

  const getProgramIDL = async (programAddress: string) => {
    const address = new PublicKey(programAddress);
    const programIDL = await Program.fetchIdl(address, provider);
    return programIDL;
  };

  const isValidProgramAddress = useCallback((programAddress: string) => {
    try {
      new PublicKey(programAddress);
      return true;
    } catch {
      toast.error("Invalid program address", {
        description: "Please enter a valid program address",
      });
      return false;
    }
  }, []);

  useEffect(() => {
    if (programAddress.length >= 43 && isValidProgramAddress(programAddress)) {
      const fetchProgramIDL = async () => {
        const programIDL: Idl | null = await getProgramIDL(programAddress);
        if (programIDL) {
          setJsonData(JSON.stringify(programIDL));
          setInputMethod("editor");
        } else {
          toast.error("Failed to fetch program IDL", {
            description:
              "Program hasn't added an IDL yet. Please enter the IDL manually",
          });
          setInputMethod("upload");
        }
      };
      fetchProgramIDL();
    }
  }, [programAddress, isValidProgramAddress, setInputMethod, setJsonData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[90%] w-[90%] mx-auto p-4"
    >
      <div className="flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <h2 className="text-2xl font-semibold tracking-tight">
            Get IDL from Program Address
          </h2>
          <p className="text-muted-foreground">
            Enter your program address to get the IDL
          </p>
        </motion.div>

        <Input
          type="text"
          className="h-9 font-mono text-sm transition-all duration-200 focus:shadow-sm"
          placeholder="Enter program address"
          value={programAddress}
          onChange={(e) => setProgramAddress(e.target.value)}
        />
      </div>
    </motion.div>
  );
}
