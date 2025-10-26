import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RpcOption = "mainnet-beta" | "devnet" | "localnet" | "custom";

export interface RpcEndpoint {
  value: RpcOption;
  label: string;
  url?: string;
  recommended?: boolean;
}

export const RPC_ENDPOINTS: ReadonlyArray<RpcEndpoint> = [
  {
    value: "mainnet-beta",
    label: "Mainnet Beta",
    url: "https://api.mainnet-beta.solana.com",
    recommended: false,
  },
  {
    value: "devnet",
    label: "Devnet",
    url: "https://api.devnet.solana.com",
    recommended: true,
  },
  {
    value: "localnet",
    label: "Localnet",
    url: "http://127.0.0.1:8899",
    recommended: true,
  },
] as const;

export interface RpcState {
  selectedRpc: RpcOption;
  customRpcUrl: string;
  dropdownOpen: boolean;

  setSelectedRpc: (rpc: RpcOption) => void;
  setCustomRpcUrl: (url: string) => void;
  setDropdownOpen: (isOpen: boolean) => void;

  getCurrentRpcUrl: () => string;
  getCurrentRpcDisplayName: () => string;
  isCustomRpc: () => boolean;
}

export const useRpcStore = create<RpcState>()(
  persist(
    (set, get) => ({
      selectedRpc: "devnet",
      customRpcUrl: "",
      dropdownOpen: false,

      setSelectedRpc: (rpc) => set({ selectedRpc: rpc }),
      setCustomRpcUrl: (url) => set({ customRpcUrl: url }),
      setDropdownOpen: (isOpen) => set({ dropdownOpen: isOpen }),

      getCurrentRpcUrl: () => {
        const { selectedRpc, customRpcUrl } = get();
        
        if (selectedRpc === "custom" && customRpcUrl) {
          return customRpcUrl;
        }

        const endpoint = RPC_ENDPOINTS.find((e) => e.value === selectedRpc);
        return endpoint?.url || RPC_ENDPOINTS[1].url!;
      },

      getCurrentRpcDisplayName: () => {
        const { selectedRpc, customRpcUrl } = get();
        
        if (selectedRpc === "custom") {
          return customRpcUrl || "Custom RPC";
        }

        const endpoint = RPC_ENDPOINTS.find((e) => e.value === selectedRpc);
        return endpoint?.label || "Select RPC";
      },

      isCustomRpc: () => get().selectedRpc === "custom",
    }),
    {
      name: "rpc-settings",
      skipHydration: true,
    }
  )
);