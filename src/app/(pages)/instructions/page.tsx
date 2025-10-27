"use client";

import ProgramNotFound from "@/components/ProgramNotFound";
import { getExplorerUrl } from "@/components/TransactionTable";
import { TypeInput } from "@/components/TypeInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import { BN } from "@coral-xyz/anchor";
import {
  IdlInstruction,
  IdlType
} from "@coral-xyz/anchor/dist/cjs/idl";
import { useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  CheckCircle2,
  Code,
  Copy,
  ExternalLink,
  Hash,
  Loader2,
  Rocket,
  Terminal,
  Wallet as WalletIcon,
  XCircle,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SeedType = "string" | "publicKey" | "u64" | "u32" | "u16" | "u8";

interface SeedInput {
  id: string;
  type: SeedType;
  value: string;
  label: string;
}

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

  // PDA States
  const [pdaDialogOpen, setPdaDialogOpen] = useState<string | null>(null);
  const [pdaSeeds, setPdaSeeds] = useState<SeedInput[]>([
    { id: "1", type: "string", value: "", label: "Seed 1" },
  ]);

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

        // Handle enum types - they're already in correct format { VariantName: {} }
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          // Check if it's an enum object (has a single key with empty object value)
          const keys = Object.keys(value);
          if (keys.length === 1 && typeof value[keys[0] as keyof typeof value] === "object") {
            return value; // Return enum as-is
          }
        }

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
            case "pubkey":
              return value ? new PublicKey(value as string) : null;
            default:
              return value;
          }
        }

        // Handle option types
        if (typeof arg.type === "object" && "option" in arg.type) {
          if (!value || value === "") return null;

          // If option wraps a number type, convert it
          if (typeof arg.type.option === "string") {
            const optionType = arg.type.option;
            if (["u8", "i8", "u16", "i16", "u32", "i32", "u64", "i64", "u128", "i128", "u256", "i256"].includes(optionType)) {
              return new BN(value);
            }
            if (optionType === "pubkey") {
              return new PublicKey(value as string);
            }
          }

          return value;
        }

        return value;
      });
    },
    []
  );

  // Reset form when instruction changes
  useEffect(() => {
    if (instruction) {
      const resolveType = (type: IdlType): IdlType | { kind: "struct" | "enum"; fields?: Array<{ name: string; type: unknown }>; variants?: Array<{ name: string; fields?: unknown[] }> } => {
        if (typeof type === "object" && "option" in type) {
          type = type.option;
        }
        if (typeof type === "object" && "defined" in type) {
          let typeName: string;
          if (typeof type.defined === "string") {
            typeName = type.defined;
          } else if (typeof type.defined === "object" && "name" in type.defined) {
            typeName = type.defined.name;
          } else {
            return type;
          }
          const definedType = programDetails?.types?.find(
            (t) => t.name.toLowerCase() === typeName.toLowerCase()
          );
          return definedType?.type || type;
        }
        return type;
      };

      // Initialize args with default values
      const initialArgs: Record<string, unknown> = {};
      instruction.args.forEach((arg) => {
        const resolvedType = resolveType(arg.type);
        const isEnum = typeof resolvedType === "object" &&
          "kind" in resolvedType &&
          resolvedType.kind === "enum";

        if (isEnum && resolvedType.variants && resolvedType.variants.length > 0) {
          const firstVariant = resolvedType.variants[0].name;
          initialArgs[arg.name] = { [firstVariant]: {} };
        } else {
          initialArgs[arg.name] = "";
        }
      });
      setArgs(initialArgs);

      // Initialize accounts with empty values
      const initialAccounts: Record<string, string> = {};
      instruction.accounts.forEach((acc) => {
        initialAccounts[acc.name] = "";
      });
      setAccounts(initialAccounts);
    }
  }, [selectedIx, instruction, programDetails]);

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

  // Add these functions before the return statement
  const addPdaSeed = () => {
    setPdaSeeds([
      ...pdaSeeds,
      {
        id: Date.now().toString(),
        type: "string",
        value: "",
        label: `Seed ${pdaSeeds.length + 1}`,
      },
    ]);
  };

  const removePdaSeed = (id: string) => {
    if (pdaSeeds.length > 1) {
      setPdaSeeds(pdaSeeds.filter((s) => s.id !== id));
    }
  };

  const updatePdaSeed = (id: string, field: keyof SeedInput, value: string) => {
    setPdaSeeds(
      pdaSeeds.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const derivePDAForAccount = (accountName: string) => {
    if (!program) return;

    try {
      const seedBuffers: Buffer[] = [];

      for (const seed of pdaSeeds) {
        if (!seed.value.trim()) {
          throw new Error(`${seed.label} cannot be empty`);
        }

        switch (seed.type) {
          case "string":
            seedBuffers.push(Buffer.from(seed.value));
            break;
          case "publicKey":
            const pubkey = new PublicKey(seed.value);
            seedBuffers.push(pubkey.toBuffer());
            break;
          case "u64": {
            const num = BigInt(seed.value);
            const buf = Buffer.alloc(8);
            buf.writeBigUInt64LE(num);
            seedBuffers.push(buf);
            break;
          }
          case "u32": {
            const num = parseInt(seed.value);
            const buf = Buffer.alloc(4);
            buf.writeUInt32LE(num);
            seedBuffers.push(buf);
            break;
          }
          case "u16": {
            const num = parseInt(seed.value);
            const buf = Buffer.alloc(2);
            buf.writeUInt16LE(num);
            seedBuffers.push(buf);
            break;
          }
          case "u8": {
            const num = parseInt(seed.value);
            const buf = Buffer.alloc(1);
            buf.writeUInt8(num);
            seedBuffers.push(buf);
            break;
          }
        }
      }

      const [pda] = PublicKey.findProgramAddressSync(
        seedBuffers,
        program.programId
      );

      handleAccountChange(accountName, pda.toBase58());
      setPdaDialogOpen(null);
      setPdaSeeds([{ id: "1", type: "string", value: "", label: "Seed 1" }]);
      toast.success("PDA derived and filled!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to derive PDA");
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
                          {instruction.args.map((arg) => {
                            const resolveType = (type: IdlType): IdlType | { kind: "struct" | "enum"; fields?: Array<{ name: string; type: unknown }>; variants?: Array<{ name: string; fields?: unknown[] }> } => {
                              // Handle option types: {option: {defined: {name: "TypeName"}}}
                              if (typeof type === "object" && "option" in type) {
                                type = type.option;
                              }

                              if (typeof type === "object" && "defined" in type) {
                                // Handle both {defined: "TypeName"} and {defined: {name: "TypeName"}}
                                let typeName: string;

                                if (typeof type.defined === "string") {
                                  typeName = type.defined;
                                } else if (typeof type.defined === "object" && "name" in type.defined) {
                                  typeName = type.defined.name;
                                } else {
                                  return type;
                                }

                                // Find the type definition in programDetails.types
                                const definedType = programDetails?.types?.find(
                                  (t) => t.name.toLowerCase() === typeName.toLowerCase()
                                );

                                return definedType?.type || type;
                              }
                              return type;
                            };

                            const resolvedType = resolveType(arg.type);
                            const isEnum = typeof resolvedType === "object" &&
                              "kind" in resolvedType &&
                              resolvedType.kind === "enum";

                            const getSelectedEnumVariant = (value: unknown): string => {
                              if (typeof value === "object" && value !== null) {
                                const keys = Object.keys(value);
                                return keys.length > 0 ? keys[0] : "";
                              }
                              return "";
                            };

                            return (
                              <div key={arg.name} className="space-y-2 bg-muted/40 p-4 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <Label htmlFor={`arg-${arg.name}`} className="font-medium">
                                    {arg.name}
                                  </Label>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {isEnum
                                      ? "enum"
                                      : typeof arg.type === "object" && "option" in arg.type
                                        ? `optional ${typeof arg.type.option === "string" ? arg.type.option : "type"}`
                                        : typeof arg.type === "string"
                                          ? arg.type
                                          : JSON.stringify(arg.type)}
                                  </Badge>
                                </div>

                                {isEnum ? (
                                  <Select
                                    value={getSelectedEnumVariant(args[arg.name])}
                                    onValueChange={(value) => handleArgChange(arg.name, { [value]: {} })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder={`Select ${arg.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(typeof resolvedType === "object" &&
                                        "variants" in resolvedType &&
                                        Array.isArray(resolvedType.variants)
                                        ? resolvedType.variants
                                        : []
                                      ).map((variant: { name: string; fields?: unknown[] }) => (
                                        <SelectItem key={variant.name} value={variant.name}>
                                          {variant.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <TypeInput
                                    type={arg.type}
                                    value={args[arg.name] as string | number | readonly string[] | undefined}
                                    onChange={(value: unknown) => handleArgChange(arg.name, value)}
                                    placeholder={`Enter ${arg.name}`}
                                    className="mt-1.5"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {instruction.args.length > 0 &&
                      instruction.accounts.length > 0 && (
                        <Separator className="my-6" />
                      )}

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
                                    handleAccountChange(account.name, e.target.value)
                                  }
                                  placeholder={`Enter ${account.name} public key`}
                                  className="font-mono text-sm flex-1"
                                />

                                {/* Derive PDA Button */}
                                <Dialog open={pdaDialogOpen === account.name} onOpenChange={(open) => setPdaDialogOpen(open ? account.name : null)}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      title="Derive PDA"
                                    >
                                      <Hash className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Derive PDA for {account.name}</DialogTitle>
                                      <DialogDescription>
                                        Configure seeds to derive a Program Derived Address
                                      </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-4 py-4">
                                      {pdaSeeds.map((seed, index) => (
                                        <div key={seed.id} className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
                                          <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Seed {index + 1}</Label>
                                            {pdaSeeds.length > 1 && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs text-red-600"
                                                onClick={() => removePdaSeed(seed.id)}
                                              >
                                                Remove
                                              </Button>
                                            )}
                                          </div>

                                          <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-2">
                                              <Label className="text-xs">Type</Label>
                                              <Select
                                                value={seed.type}
                                                onValueChange={(value) => updatePdaSeed(seed.id, "type", value)}
                                              >
                                                <SelectTrigger className="h-9">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="string">String</SelectItem>
                                                  <SelectItem value="publicKey">Public Key</SelectItem>
                                                  <SelectItem value="u64">u64</SelectItem>
                                                  <SelectItem value="u32">u32</SelectItem>
                                                  <SelectItem value="u16">u16</SelectItem>
                                                  <SelectItem value="u8">u8</SelectItem>
                                                </SelectContent>
                                              </Select>
                                            </div>

                                            <div className="space-y-2">
                                              <Label className="text-xs">Value</Label>
                                              <Input
                                                placeholder={seed.type === "string" ? "e.g., account" : seed.type === "publicKey" ? "Base58 address" : "Number"}
                                                value={seed.value}
                                                onChange={(e) => updatePdaSeed(seed.id, "value", e.target.value)}
                                                className="h-9 font-mono text-sm"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      ))}

                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={addPdaSeed}>
                                          Add Seed
                                        </Button>
                                        <Button
                                          onClick={() => derivePDAForAccount(account.name)}
                                          className="flex-1"
                                          disabled={pdaSeeds.some((s) => !s.value.trim())}
                                        >
                                          <Hash className="h-4 w-4 mr-2" />
                                          Derive & Fill
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>

                                {/* Existing wallet button */}
                                {publicKey && ["authority", "payer", "signer"].some((term) =>
                                  account.name.toLowerCase().includes(term.toLowerCase())
                                ) && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleAccountChange(account.name, publicKey.toString())}
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
