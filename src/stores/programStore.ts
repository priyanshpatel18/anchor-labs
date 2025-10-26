import { create } from "zustand";
import { Program, Idl, AnchorProvider } from "@coral-xyz/anchor";
import { Connection, Commitment, Cluster } from "@solana/web3.js";
import { AnchorWallet } from "@jup-ag/wallet-adapter";
import { persist } from "zustand/middleware";

type AnyProgram = Program<Idl>;
type CommitmentLevel = Commitment;

export interface ProgramDetails {
  programId: string;
  name: string;
  rpcUrl: string;
  cluster: Cluster | string;
  commitment: CommitmentLevel;
  initializedAt: number;
  serializedIdl: string;
}

interface ProgramError {
  name: string;
  message: string;
  stack?: string;
}

export interface ProgramState {
  program: AnyProgram | null;
  provider: AnchorProvider | null;
  connection: Connection | null;
  isInitialized: boolean;
  isReinitializing: boolean;
  error: ProgramError | null;
  programDetails: ProgramDetails | null;

  initialize: (
    idl: Idl,
    rpcUrl: string,
    wallet: AnchorWallet,
    commitment?: CommitmentLevel
  ) => Promise<AnyProgram | null>;

  reinitialize: (wallet: AnchorWallet) => Promise<AnyProgram | null>;
  reset: () => void;
}

const DEFAULT_COMMITMENT: CommitmentLevel = "confirmed";

const CONNECTION_CONFIG = {
  commitment: DEFAULT_COMMITMENT,
  confirmTransactionInitialTimeout: 30000,
};

function detectCluster(rpcUrl: string): Cluster | string {
  const url = rpcUrl.toLowerCase();
  if (url.includes("devnet")) return "devnet";
  if (url.includes("testnet")) return "testnet";
  if (url.includes("mainnet")) return "mainnet-beta";
  if (url.includes("localhost") || url.includes("127.0.0.1")) return "localnet";
  return "custom";
}

function createErrorObject(error: unknown, defaultName: string): ProgramError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  
  return {
    name: defaultName,
    message: typeof error === "string" ? error : String(error),
  };
}

type PersistedState = Pick<ProgramState, "programDetails" | "isInitialized">;

const useProgramStore = create<ProgramState>()(
  persist(
    (set, get) => ({
      program: null,
      provider: null,
      connection: null,
      isInitialized: false,
      isReinitializing: false,
      error: null,
      programDetails: null,

      initialize: async (
        idl: Idl,
        rpcUrl: string,
        wallet: AnchorWallet,
        commitment: CommitmentLevel = DEFAULT_COMMITMENT
      ): Promise<AnyProgram | null> => {
        try {
          set({
            error: null,
            isInitialized: false,
            program: null,
            provider: null,
            connection: null,
            programDetails: null,
          });

          const connection = new Connection(rpcUrl, CONNECTION_CONFIG);
          const provider = new AnchorProvider(connection, wallet, {
            preflightCommitment: commitment,
            commitment,
          });
          const program = new Program(idl, provider);

          const programDetails: ProgramDetails = {
            programId: program.programId.toString(),
            name: idl.metadata?.name || "Anchor Program",
            rpcUrl,
            cluster: detectCluster(rpcUrl),
            commitment,
            initializedAt: Date.now(),
            serializedIdl: JSON.stringify(idl),
          };

          set({
            isInitialized: true,
            program,
            provider,
            connection,
            programDetails,
          });

          console.log("✓ Program initialized:", programDetails.name);
          return program;
        } catch (error) {
          const errorObj = createErrorObject(error, "InitializationError");
          console.error("✗ Program initialization failed:", errorObj);

          set({
            error: errorObj,
            isInitialized: false,
            program: null,
            provider: null,
            connection: null,
            programDetails: null,
          });

          throw new Error(errorObj.message);
        }
      },

      reinitialize: async (wallet: AnchorWallet) => {
        const { programDetails, isReinitializing } = get();

        if (!programDetails) {
          console.warn("⚠ No program details found for reinitialization");
          return null;
        }

        if (isReinitializing) {
          console.warn("⚠ Reinitialization already in progress");
          return null;
        }

        try {
          set({ isReinitializing: true });
          console.log("↻ Reinitializing program...");

          const idl: Idl = JSON.parse(programDetails.serializedIdl);
          const program = await get().initialize(
            idl,
            programDetails.rpcUrl,
            wallet,
            programDetails.commitment
          );

          console.log("✓ Program reinitialized successfully");
          return program;
        } catch (error) {
          const errorObj = createErrorObject(error, "ReinitializationError");
          console.error("✗ Reinitialization failed:", errorObj);

          get().reset();
          set({ error: errorObj });
          throw new Error(errorObj.message);
        } finally {
          set({ isReinitializing: false });
        }
      },

      reset: () => {
        set({
          isInitialized: false,
          program: null,
          provider: null,
          connection: null,
          programDetails: null,
          error: null,
        });
        console.log("↺ Program store reset");
      },
    }),
    {
      name: "anchor-studio-program",
      partialize: (state) =>
        ({
          programDetails: state.programDetails,
          isInitialized: state.isInitialized,
        } as PersistedState),
    }
  )
);

export default useProgramStore;