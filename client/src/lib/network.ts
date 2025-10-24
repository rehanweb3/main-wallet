import type { NetworkConfig } from "@shared/schema";

export const getNetworkConfig = (): NetworkConfig => {
  return {
    name: import.meta.env.VITE_NETWORK_NAME || "MintraxChain",
    rpc: import.meta.env.VITE_RPC_URL || "https://rpc.mintrax.network",
    chainId: Number(import.meta.env.VITE_CHAIN_ID) || 478549,
    nativeToken: import.meta.env.VITE_NATIVE_TOKEN || "MTX",
    explorer: import.meta.env.VITE_EXPLORER_URL || "https://explorer.mintrax.network",
  };
};
