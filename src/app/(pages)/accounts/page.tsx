"use client";

import { AccountData } from "@/components/AccountTable";
import ProgramNotFound from "@/components/ProgramNotFound";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAccountData } from "@/hooks/useAccountData";
import { useAutoReinitialize } from "@/hooks/useAutoReinitialize";
import useProgramStore from "@/stores/programStore";
import { IdlAccount } from "@coral-xyz/anchor/dist/cjs/idl";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AlertCircle, Database, Inbox, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";

const AccountTable = dynamic(
  () => import("@/components/AccountTable").then((mod) => mod.AccountTable),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    ),
  }
);

function AccountTabContent({
  account,
  isActive,
}: {
  account: IdlAccount;
  isActive: boolean;
}) {
  const { program } = useProgramStore();
  if (!program) return null;

  const {
    data: accountsData,
    isLoading,
    error,
  } = useAccountData(
    program,
    account.name as keyof (typeof program.idl)["accounts"],
    { enabled: isActive && !!program }
  );

  const accountType = useMemo(
    () => program?.idl?.types?.find((type) => type.name === account.name),
    [program, account]
  );

  const transformedData: AccountData[] = useMemo(
    () =>
      accountsData?.map((item) => ({
        publicKey: item.publicKey.toString(),
        account: item.account as Record<string, unknown>,
      })) ?? [],
    [accountsData]
  );

  if (!program) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    const errorMsg = error?.message || "";
    if (
      errorMsg.includes("ERR_BLOCKED_BY_CLIENT") ||
      errorMsg.includes("Failed to fetch")
    ) {
      return (
        <div className="p-4 text-red-500">
          Your browser is blocking requests to the URL required to fetch account
          data. This is often caused by an ad blocker, browser extension, or
          network policy. Please whitelist this site or disable the extension
          for this page.
          <br />
          <span className="text-xs break-all">{errorMsg}</span>
        </div>
      );
    }
    return (
      <div className="p-4 text-red-500">
        Error fetching accounts: {errorMsg}
      </div>
    );
  }

  if (!accountType) {
    return (
      <div className="p-4 text-orange-500">
        Could not find type definition for account: {account.name}
      </div>
    );
  }

  return <AccountTable data={transformedData} accountType={accountType} />;
}

export default function AccountsPage() {
  const programStoreState = useProgramStore((state) => state);
  const { program, programDetails, error } = programStoreState;
  const wallet = useAnchorWallet();
  useAutoReinitialize(wallet)
  const accounts = useMemo(() => program?.idl?.accounts || [], [program]);

  const [activeTab, setActiveTab] = useState(accounts[0]?.name ?? "");

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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
    return <ProgramNotFound />;
  }

  if (accounts.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-muted/20">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Inbox className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No Account Types Defined</h2>
          <p className="text-muted-foreground text-center max-w-md">
            This program doesn&lsquo;t define any account types in its IDL. Account types are required to store and query on-chain data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Program Accounts</h1>
              <p className="text-sm text-muted-foreground mt-1">
                View and explore on-chain account data for {programDetails.name || 'this program'}
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2 -mx-1 px-1">
            <TabsList className="inline-flex h-11 items-center justify-start rounded-lg bg-muted p-1 w-auto min-w-full sm:min-w-0">
              {accounts.map((account) => (
                <TabsTrigger
                  key={account.name}
                  value={account.name}
                  className="text-sm font-medium px-4 py-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                >
                  {account.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {accounts.map((account) => (
            <TabsContent key={account.name} value={account.name}>
              <AccountTabContent
                account={account}
                isActive={activeTab === account.name}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}