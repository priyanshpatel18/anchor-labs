"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useProgramStore from "@/stores/programStore";
import { BN } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  CheckCircle2,
  Code,
  Copy,
  ExternalLink,
  Loader2,
  Rocket,
  Terminal,
  Wallet as WalletIcon,
  XCircle,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import ProgramNotFound from "@/components/ProgramNotFound";
import { getExplorerUrl } from "@/components/TransactionTable";
import { TypeInput } from "@/components/TypeInput";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import {
  IdlInstruction,
  IdlInstructionAccount
} from "@coral-xyz/anchor/dist/cjs/idl";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";

export default function InstructionBuilderPage() {
  const { program, programDetails } = useProgramStore();
  const wallet = useAnchorWallet();
  useAutoReinitialize(wallet);
  const { publicKey, sendTransaction } = useWallet();
  const connection = useMemo(() => {
    if (programDetails) {
      return new Connection(programDetails.rpcUrl);
    }
  }, [programDetails]);
  const [selectedIx, setSelectedIx] = useState<string>("");

  const [args, setArgs] = useState<Record<string, unknown>>({});
  const [accounts, setAccounts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ signature: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showError, setShowError] = useState(false);

  // Get instructions from the program IDL
  const instructions = program?.idl?.instructions;
  // Format instruction names for better display
  const formattedInstructions = useMemo(() => {
    return instructions
      ? instructions.map((ix) => ({
        ...ix,
        displayName:
          ix.name.charAt(0).toUpperCase() +
          ix.name.slice(1).replace(/_/g, " "),
      }))
      : [];
  }, [instructions]);

  const instruction = useMemo(() => {
    return instructions?.find((ix) => ix.name === selectedIx);
  }, [instructions, selectedIx]);

  const areArgsValid = useMemo(() => {
    if (!instruction) return false;
    return instruction.args.every(
      (arg) => args[arg.name] !== undefined && args[arg.name] !== ""
    );
  }, [args, instruction]);

  const areAccountsValid = useMemo(() => {
    if (!instruction) return false;
    const requiredAccounts = instruction.accounts.filter(
      (acc) => !("optional" in acc && acc.optional)
    );
    return requiredAccounts.every(
      (acc) => accounts[acc.name] !== undefined && accounts[acc.name] !== ""
    );
  }, [accounts, instruction]);

  const isFormValid = areArgsValid && areAccountsValid;

  const initialSelectedIx = useMemo(() => {
    return formattedInstructions.length > 0
      ? formattedInstructions[0].name
      : "";
  }, [formattedInstructions]);

  useEffect(() => {
    if (initialSelectedIx && !selectedIx) {
      setSelectedIx(initialSelectedIx);
    }
  }, [initialSelectedIx, selectedIx]);

  const processArgs = useCallback(
    (currentArgs: Record<string, unknown>, ix: IdlInstruction) => {
      return ix.args.map((arg) => {
        const value = currentArgs[arg.name];
        if (typeof arg.type === "string") {
          switch (arg.type) {
            case "u8":
            case "i8":
            case "u16":
            case "i16":
            case "u32":
            case "i32":
            case "u64":
            case "i64":
            case "u128":
            case "i128":
            case "u256":
            case "i256":
              return value ? new BN(value) : new BN(0);
            default:
              return value;
          }
        }
        return value;
      });
    },
    []
  );

  // Fetch resolved pubkeys using method builder
  const fetchResolvedPubkeys = useCallback(async () => {
    if (!program || !instruction || !publicKey) return;

    try {
      // Create method builder with current args
      const processedArgs = processArgs(args, instruction);
      const methodBuilder = program.methods[instruction.name](...processedArgs);

      // Get resolved pubkeys
      const resolvedPubkeys = await methodBuilder.pubkeys();

      // Update accounts with resolved pubkeys
      const updates: Record<string, string> = {};

      for (const [accountName, pubkey] of Object.entries(resolvedPubkeys)) {
        if (pubkey) {
          updates[accountName] = pubkey.toString();
        }
      }

      // Auto-populate signer accounts
      const commonSigners = instruction.accounts.filter(
        (acc) =>
          "signer" in acc &&
          acc.signer === true &&
          ["authority", "payer", "signer"].some((name) =>
            acc.name.toLowerCase().includes(name.toLowerCase())
          )
      ) as IdlInstructionAccount[];

      for (const account of commonSigners) {
        updates[account.name] = publicKey.toString();
      }

      // Update accounts state if we have any resolved pubkeys
      if (Object.keys(updates).length > 0) {
        setAccounts((prev) => ({ ...prev, ...updates }));
      }
    } catch (error) {
      console.warn("Failed to resolve pubkeys:", error);
    }
  }, [program, instruction, args, publicKey, processArgs]);

  // Auto-populate accounts when instruction or args change
  useEffect(() => {
    if (instruction && Object.keys(args).length > 0) {
      fetchResolvedPubkeys();
    }
  }, [instruction, args, fetchResolvedPubkeys]);

  // Reset form when instruction changes
  useEffect(() => {
    if (instruction) {
      // Initialize args with default values
      const initialArgs: Record<string, unknown> = {};
      instruction.args.forEach((arg) => {
        initialArgs[arg.name] = "";
      });
      setArgs(initialArgs);

      // Initialize accounts with empty values
      const initialAccounts: Record<string, string> = {};
      instruction.accounts.forEach((acc) => {
        initialAccounts[acc.name] = "";
      });
      setAccounts(initialAccounts);
    }
  }, [selectedIx]);

  const handleArgChange = (name: string, value: unknown) => {
    const newArgs = {
      ...args,
      [name]: value,
    };
    setArgs(newArgs);
  };

  const handleAccountChange = (name: string, value: string) => {
    setAccounts((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!program || !instruction || !publicKey || !connection) {
      setError("Program, instruction, or wallet not available");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Prepare arguments
      const processedArgs = processArgs(args, instruction);

      // 2. Create method builder with args
      const methodBuilder = program.methods[instruction.name](...processedArgs);

      // 3. Resolve accounts
      const accountsObject: Record<string, PublicKey> = {};
      const unresolvedAccounts: string[] = [];

      // If we have unresolved required accounts, show an error
      if (unresolvedAccounts.length > 0) {
        throw new Error(
          `The following required accounts could not be resolved automatically: ${unresolvedAccounts.join(
            ", "
          )}. Please provide them manually.`
        );
      }

      // 4. Add any remaining accounts that were provided manually
      for (const [name, value] of Object.entries(accounts)) {
        if (value && !accountsObject[name]) {
          try {
            accountsObject[name] = new PublicKey(value);
          } catch (err) {
            console.warn(`Invalid public key for account ${name}:`, err);
          }
        }
      }

      // 5. Build transaction instead of sending directly
      const transaction = await methodBuilder
        .accounts(accountsObject)
        .transaction();

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // 6. Send transaction through wallet for user signature
      const txSignature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
      });

      console.log("Transaction sent with signature:", txSignature);

      // 7. Optionally confirm the transaction
      const confirmation = await connection.confirmTransaction({
        signature: txSignature,
        blockhash,
        lastValidBlockHeight,
      });

      if (confirmation.value.err) {
        throw new Error("Transaction failed");
      }

      setResult({ signature: txSignature });
      setShowResult(true);
      toast.success("Transaction sent", {
        description: "Your transaction was successfully sent to the network.",
      });
    } catch (err) {
      console.error("Transaction failed:", err);
      if (err instanceof Error) {
        setError(err.message || "An unknown error occurred");
        setShowError(true);
        toast.error("Transaction failed", {
          description: err.message || "An unknown error occurred",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!program || !programDetails) {
    return <ProgramNotFound />;
  }

  if (!instructions || instructions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          No instructions found in the program IDL.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Instruction Builder</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Execute instructions from the {programDetails?.name || "selected"}{" "}
                program
              </p>
            </div>
          </div>
        </div>

        {formattedInstructions.length > 0 ? (
          <Tabs
            value={selectedIx}
            onValueChange={setSelectedIx}
            defaultValue={initialSelectedIx}
            className="w-full"
          >
            <div className="overflow-x-auto">
              <TabsList className="inline-flex h-auto p-1">
                {formattedInstructions.map((ix) => (
                  <TabsTrigger
                    key={ix.name}
                    value={ix.name}
                    className="text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2"
                  >
                    {ix.displayName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Render content for the selected instruction */}
            {instruction && (
              <TabsContent
                value={instruction.name}
                className="mt-4 flex flex-col flex-1 overflow-hidden"
              >
                <Card className="w-full flex flex-col flex-1 overflow-hidden">
                  <CardHeader className="flex-shrink-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-semibold">
                          {instruction.name.charAt(0).toUpperCase() +
                            instruction.name.slice(1).replace(/_/g, " ")}
                        </CardTitle>
                        {instruction.docs && instruction.docs[0] && (
                          <CardDescription className="mt-1.5">
                            {instruction.docs[0]}
                          </CardDescription>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {instruction.args.length} Args
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {instruction.accounts.length} Accounts
                          </Badge>
                        </div>
                      </div>
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-shrink-0">
                              <Button
                                onClick={handleSubmit}
                                disabled={
                                  !isFormValid || isLoading || !publicKey
                                }
                                size="lg"
                                className="gap-2 px-6 font-semibold shadow-md"
                              >
                                {isLoading ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Executing...
                                  </>
                                ) : !publicKey ? (
                                  <>
                                    <WalletIcon className="h-4 w-4" />
                                    Connect Wallet
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="h-4 w-4" />
                                    Execute
                                  </>
                                )}
                              </Button>
                            </div>
                          </TooltipTrigger>
                          {!publicKey ? (
                            <TooltipContent>
                              <p>Connect your wallet to execute.</p>
                            </TooltipContent>
                          ) : !isFormValid ? (
                            <TooltipContent>
                              <p>Please fill in all required fields.</p>
                            </TooltipContent>
                          ) : null}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6 min-h-0">
                    {/* Arguments Section */}
                    {instruction.args.length > 0 && (
                      <div>
                        <div className="flex items-center mb-4">
                          <Code className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="text-lg font-medium">Arguments</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {instruction.args.map((arg) => (
                            <div
                              key={arg.name}
                              className="space-y-2 bg-muted/40 p-4 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <Label
                                  htmlFor={`arg-${arg.name}`}
                                  className="font-medium"
                                >
                                  {arg.name}
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {typeof arg.type === "string"
                                    ? arg.type
                                    : JSON.stringify(arg.type)}
                                </Badge>
                              </div>
                              <TypeInput
                                type={arg.type}
                                value={args[arg.name] as string | number | readonly string[] | undefined}
                                onChange={(value: unknown) =>
                                  handleArgChange(arg.name, value)
                                }
                                placeholder={`Enter ${arg.name}`}
                                className="mt-1.5"
                              />
                              {arg.docs && arg.docs[0] && (
                                <p className="text-xs text-muted-foreground mt-1.5">
                                  {arg.docs[0]}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {instruction.args.length > 0 &&
                      instruction.accounts.length > 0 && (
                        <Separator className="my-6" />
                      )}

                    {/* Accounts Section */}
                    {instruction.accounts.length > 0 && (
                      <div>
                        <div className="flex items-center mb-4">
                          <Terminal className="h-5 w-5 mr-2 text-primary" />
                          <h3 className="text-lg font-medium">Accounts</h3>
                        </div>
                        <div className="space-y-4">
                          {instruction.accounts.map((account) => (
                            <div
                              key={account.name}
                              className="bg-muted/40 p-4 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <Label
                                  htmlFor={`account-${account.name}`}
                                  className="font-medium"
                                >
                                  {account.name}
                                </Label>
                                <div className="flex gap-1.5">
                                  {"signer" in account && account.signer && (
                                    <Badge
                                      variant="secondary"
                                      className="font-normal text-xs"
                                    >
                                      Signer
                                    </Badge>
                                  )}
                                  {"writable" in account &&
                                    account.writable && (
                                      <Badge
                                        variant="default"
                                        className="font-normal text-xs"
                                      >
                                        Mutable
                                      </Badge>
                                    )}
                                  {"optional" in account &&
                                    account.optional && (
                                      <Badge
                                        variant="outline"
                                        className="font-normal text-xs"
                                      >
                                        Optional
                                      </Badge>
                                    )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Input
                                  id={`account-${account.name}`}
                                  value={accounts[account.name] || ""}
                                  onChange={(e) =>
                                    handleAccountChange(
                                      account.name,
                                      e.target.value
                                    )
                                  }
                                  placeholder={`Enter ${account.name} public key`}
                                  className="font-mono text-sm flex-1"
                                />
                                {publicKey &&
                                  ["authority", "payer", "signer"].some(
                                    (term) =>
                                      account.name
                                        .toLowerCase()
                                        .includes(term.toLowerCase())
                                  ) && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() =>
                                        handleAccountChange(
                                          account.name,
                                          publicKey.toString()
                                        )
                                      }
                                      title="Use connected wallet"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  )}
                              </div>
                              {"docs" in account &&
                                account.docs &&
                                account.docs[0] && (
                                  <p className="text-xs text-muted-foreground">
                                    {account.docs[0]}
                                  </p>
                                )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Fallback if no instruction is selected but tabs are present */}
            {!instruction && formattedInstructions.length > 0 && (
              <Card className="mt-4 flex items-center justify-center h-[200px]">
                <CardContent>
                  <p className="text-muted-foreground">
                    Select an instruction to view details.
                  </p>
                </CardContent>
              </Card>
            )}
          </Tabs>
        ) : (
          <Card className="flex items-center justify-center h-[200px]">
            <CardContent>
              <p className="text-muted-foreground">
                No instructions available to display in tabs.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Success Toast Notification */}
        {result && showResult && (
          <div className="fixed top-6 right-6 z-50 w-full max-w-sm">
            <Card className="border-green-500/20 bg-green-500/5 shadow-lg">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center text-base font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Transaction Successful
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResult(false)}
                >
                  <XCircle className="h-4 w-4 text-green-500" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Signature:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1"
                        asChild
                      >
                        <Link href={`${getExplorerUrl(result.signature, "solana", programDetails.rpcUrl)}`} target="_blank">
                          <span className="text-xs">View Transaction</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                    <div className="p-3 bg-background rounded-md overflow-x-auto flex items-center gap-2 border">
                      <code className="text-xs break-all flex-1">
                        {result?.signature}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          if (result?.signature) {
                            navigator.clipboard.writeText(result.signature);
                            toast.success("Signature copied to clipboard");
                          }
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Toast Notification */}
        {error && showError && (
          <div className="fixed top-6 right-6 z-50 w-full max-w-sm">
            <Card className="border-destructive bg-destructive/10 shadow-lg">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div className="flex items-center text-base font-medium text-destructive">
                  <XCircle className="h-4 w-4 mr-2 text-destructive" />
                  Transaction Failed
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowError(false)}
                >
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-background rounded-md border">
                  <div className="flex items-start justify-between gap-2">
                    <code className="text-xs break-all text-destructive">
                      {error}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => {
                        if (error) {
                          navigator.clipboard.writeText(error);
                          toast.success("Error copied to clipboard");
                        }
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
