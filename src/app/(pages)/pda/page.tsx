"use client";

import ProgramNotFound from "@/components/ProgramNotFound";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  AlertCircle,
  Check,
  Copy,
  Hash,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

// Seed types that can be used in PDA derivation
type SeedType = "string" | "publicKey" | "u64" | "u32" | "u16" | "u8";

interface SeedInput {
  id: string;
  type: SeedType;
  value: string;
  label: string;
}

interface DerivedPDA {
  address: string;
  bump: number;
  seeds: SeedInput[];
}

export default function PDAPage() {
  const { program, programDetails, error } = useProgramStore();
  const [seeds, setSeeds] = useState<SeedInput[]>([
    { id: "1", type: "string", value: "", label: "Seed 1" },
  ]);
  const [derivedPDA, setDerivedPDA] = useState<DerivedPDA | null>(null);
  const [deriveError, setDeriveError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const wallet = useAnchorWallet();
  useAutoReinitialize(wallet);

  // Get account types from IDL for hints
  const accountTypes = useMemo(
    () => program?.idl?.accounts?.map((acc) => acc.name) || [],
    [program]
  );

  const addSeed = () => {
    setSeeds([
      ...seeds,
      {
        id: Date.now().toString(),
        type: "string",
        value: "",
        label: `Seed ${seeds.length + 1}`,
      },
    ]);
  };

  const removeSeed = (id: string) => {
    if (seeds.length > 1) {
      setSeeds(seeds.filter((s) => s.id !== id));
    }
  };

  const updateSeed = (id: string, field: keyof SeedInput, value: string) => {
    setSeeds(
      seeds.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const derivePDA = async () => {
    if (!program) return;

    try {
      setDeriveError("");

      // Convert seeds to Buffer array
      const seedBuffers: Buffer[] = [];

      for (const seed of seeds) {
        if (!seed.value.trim()) {
          throw new Error(`${seed.label} cannot be empty`);
        }

        switch (seed.type) {
          case "string":
            seedBuffers.push(Buffer.from(seed.value));
            break;

          case "publicKey":
            try {
              const pubkey = new PublicKey(seed.value);
              seedBuffers.push(pubkey.toBuffer());
            } catch {
              throw new Error(`${seed.label}: Invalid public key format`);
            }
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

      // Derive PDA
      const [pda, bump] = PublicKey.findProgramAddressSync(
        seedBuffers,
        program.programId
      );

      setDerivedPDA({
        address: pda.toBase58(),
        bump,
        seeds: [...seeds],
      });

      toast.success("PDA derived successfully!");
    } catch (err) {
      if (err instanceof Error)
        setDeriveError(err.message || "Failed to derive PDA");
      setDerivedPDA(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  };

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <div className="font-medium mb-1">Program Initialization Failed</div>
            <div className="text-sm opacity-90">{error.message}</div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!program || !programDetails) {
    return <ProgramNotFound />
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Hash className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                PDA Derivation
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Derive Program Derived Addresses without writing code
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  How it works
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Add seeds in order, choose their type, and derive your PDA. Common patterns:
                  <code className="mx-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs">
                    [&quot;account_type&quot;, user_pubkey, id]
                  </code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Program Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Program Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm text-muted-foreground">Program ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm">
                  {program.programId.toBase58().slice(0, 8)}...
                  {program.programId.toBase58().slice(-8)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(program.programId.toBase58())}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {accountTypes.length > 0 && (
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-muted-foreground">
                  Account Types
                </span>
                <div className="flex flex-wrap gap-1 justify-end max-w-xs">
                  {accountTypes.map((type) => (
                    <span
                      key={type}
                      className="text-xs px-2 py-1 bg-muted rounded-md font-mono"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Seed Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configure Seeds</CardTitle>
            <CardDescription>
              Add and configure seeds for PDA derivation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {seeds.map((seed, index) => (
              <div
                key={seed.id}
                className="flex flex-col sm:flex-row gap-3 p-4 border rounded-lg bg-muted/20"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Seed {index + 1}
                    </Label>
                    {seeds.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeSeed(seed.id)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`type-${seed.id}`} className="text-xs">
                        Type
                      </Label>
                      <Select
                        value={seed.type}
                        onValueChange={(value) =>
                          updateSeed(seed.id, "type", value)
                        }
                      >
                        <SelectTrigger id={`type-${seed.id}`} className="h-9">
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
                      <Label htmlFor={`value-${seed.id}`} className="text-xs">
                        Value
                      </Label>
                      <Input
                        id={`value-${seed.id}`}
                        placeholder={
                          seed.type === "string"
                            ? "e.g., user_account"
                            : seed.type === "publicKey"
                              ? "Base58 address"
                              : "Number"
                        }
                        value={seed.value}
                        onChange={(e) =>
                          updateSeed(seed.id, "value", e.target.value)
                        }
                        className="h-9 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addSeed}
                className="w-full sm:w-auto"
              >
                Add Seed
              </Button>
              <Button
                onClick={derivePDA}
                className="w-full sm:flex-1"
                disabled={seeds.some((s) => !s.value.trim())}
              >
                <Hash className="h-4 w-4 mr-2" />
                Derive PDA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {deriveError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">{deriveError}</AlertDescription>
          </Alert>
        )}

        {/* Result Display */}
        {derivedPDA && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Derived PDA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Address</Label>
                <div className="flex items-center gap-2 p-3 bg-background border rounded-lg">
                  <span className="font-mono text-sm flex-1 break-all">
                    {derivedPDA.address}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => copyToClipboard(derivedPDA.address)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Bump</Label>
                <div className="p-3 bg-background border rounded-lg">
                  <span className="font-mono text-sm">{derivedPDA.bump}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Seeds Used</Label>
                <div className="space-y-2">
                  {derivedPDA.seeds.map((seed, idx) => (
                    <div
                      key={seed.id}
                      className="flex items-center justify-between p-2 bg-background border rounded text-sm"
                    >
                      <span className="text-muted-foreground">
                        Seed {idx + 1} ({seed.type})
                      </span>
                      <span className="font-mono truncate ml-2 max-w-[200px]">
                        {seed.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}