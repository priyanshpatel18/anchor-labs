import * as anchor from "@coral-xyz/anchor";
import { AllAccountsMap } from "@coral-xyz/anchor/dist/cjs/program/namespace/types";
import { useQuery } from "@tanstack/react-query";

// Fetch all accounts of a specific type
const getAllAccountsData = async <T extends anchor.Idl>(
  program: anchor.Program<T>,
  accountName: keyof AllAccountsMap<T>
) => {
  try {
    const accountNameStr = String(accountName);

    if (!program.account[accountNameStr as keyof typeof program.account]) {
      throw new Error(`Account type "${accountNameStr}" not found in program`);
    }

    const data = await program.account[accountNameStr as keyof typeof program.account].all();
    return data;
  } catch (error) {
    console.error(`Error fetching all ${String(accountName)} accounts:`, error);
    throw error;
  }
};

// Fetch a single account by public key
export const getAccountData = async <T extends anchor.Idl>(
  program: anchor.Program<T>,
  accountName: keyof AllAccountsMap<T>,
  pubkey: string
) => {
  if (!pubkey) return null;

  try {
    const accountKeys = new anchor.web3.PublicKey(pubkey);
    const accountNameStr = String(accountName);

    if (!program.account[accountNameStr as keyof typeof program.account]) {
      throw new Error(`Account type "${accountNameStr}" not found in program`);
    }

    const data = await program.account[accountNameStr as keyof typeof program.account].fetchNullable(
      accountKeys
    );
    return data;
  } catch (error) {
    console.error(`Error fetching ${String(accountName)} account ${pubkey}:`, error);
    throw error;
  }
};

// Hook: Fetch single account by pubkey
export function useOneAccountData<T extends anchor.Idl>(
  program: anchor.Program<T>,
  accountName: keyof AllAccountsMap<T>,
  pubkey: string,
  options?: { enabled?: boolean }
) {
  const query = useQuery({
    queryKey: ["accountData", accountName, pubkey],
    queryFn: () => getAccountData<T>(program, accountName, pubkey),
    enabled: !!program && !!accountName && !!pubkey && (options?.enabled ?? true),
    retry: 2,
    staleTime: 30000, // Cache for 30s
    refetchOnWindowFocus: false,
  });
  return query;
}

// Hook: Fetch all accounts of a type
export function useAccountData<T extends anchor.Idl>(
  program: anchor.Program<T>,
  accountName: keyof AllAccountsMap<T>,
  options?: { enabled?: boolean }
) {
  const query = useQuery({
    queryKey: ["accountData", accountName],
    queryFn: async () => {
      const data = await getAllAccountsData<T>(program, accountName);
      console.log(`Fetched ${data.length} ${String(accountName)} accounts`);
      return data;
    },
    enabled: !!program && !!accountName && (options?.enabled ?? true),
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    ...options,
  });

  return query;
}

// Hook: Fetch multiple accounts by pubkeys (batch)
export function useAccountsByPubkeys<T extends anchor.Idl>(
  program: anchor.Program<T>,
  accountName: keyof AllAccountsMap<T>,
  pubkeys: string[] | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["accountsByPubkeys", accountName, pubkeys],
    enabled:
      !!program &&
      !!accountName &&
      !!pubkeys &&
      pubkeys.length > 0 &&
      (options?.enabled ?? true),
    queryFn: async () => {
      if (!pubkeys || pubkeys.length === 0) return [];

      try {
        const accountNameStr = String(accountName);

        if (!program.account[accountNameStr as keyof typeof program.account]) {
          throw new Error(`Account type "${accountNameStr}" not found in program`);
        }

        const publicKeys = pubkeys.map((k) => new anchor.web3.PublicKey(k));
        const data = await program.account[accountNameStr as keyof typeof program.account].fetchMultiple(
          publicKeys
        );

        // Filter out null accounts (non-existent)
        return data.map((account, i) => ({
          publicKey: publicKeys[i],
          account,
        })).filter(item => item.account !== null);
      } catch (error) {
        console.error(`Error fetching multiple ${String(accountName)} accounts:`, error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    ...options,
  });
}

type AnchorProgramFilter =
  | { dataSize: number }
  | { memcmp: { offset: number; bytes: string } };

// Hook: Fetch accounts with filters (memcmp, dataSize)
export function useFilteredAccountData<T extends anchor.Idl>(
  program: anchor.Program<T>,
  accountName: keyof AllAccountsMap<T>,
  filters?: {
    memcmp?: { offset: number; bytes: string }[];
    dataSize?: number;
  },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ["filteredAccountData", accountName, filters],
    queryFn: async () => {
      const accountNameStr = String(accountName);

      if (!program.account[accountNameStr as keyof typeof program.account]) {
        throw new Error(`Account type "${accountNameStr}" not found in program`);
      }

      type AnchorFilterObject = { dataSize: number } | { memcmp: { offset: number; bytes: string } };
      const anchorFilters: AnchorProgramFilter[] = [];

      if (filters?.memcmp) {
        // FIX: Map the input memcmp array to the format Anchor expects
        // Each filter object must be wrapped in { memcmp: ... }
        const memcmpFilters: AnchorFilterObject[] = filters.memcmp.map(filter => ({
          memcmp: filter
        }));
        anchorFilters.push(...memcmpFilters);
      }
      if (filters?.dataSize) {
        anchorFilters.push({ dataSize: filters.dataSize });
      }

      const data = await program.account[accountNameStr as keyof typeof program.account].all(
        anchorFilters.length > 0 ? anchorFilters : undefined
      );

      return data;
    },
    enabled: !!program && !!accountName && (options?.enabled ?? true),
    retry: 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    ...options,
  });
}