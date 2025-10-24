import { ethers, Contract, formatUnits, parseUnits } from "ethers";
import { getNetworkConfig } from "./network";
import type { TokenMetadata } from "@shared/schema";

export interface TokenBalance {
  contractAddress: string | null;
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  logoUrl?: string;
}

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
];

// Get provider instance
export function getProvider(): ethers.JsonRpcProvider {
  const config = getNetworkConfig();
  return new ethers.JsonRpcProvider(config.rpc);
}

// Get WebSocket provider for live updates
export function getWebSocketProvider(): ethers.WebSocketProvider | null {
  const config = getNetworkConfig();
  const wsUrl = config.rpc.replace('https://', 'wss://').replace('http://', 'ws://');
  
  try {
    return new ethers.WebSocketProvider(wsUrl);
  } catch {
    return null;
  }
}

// Get signer from private key
export function getSigner(privateKey: string): ethers.Wallet {
  const provider = getProvider();
  return new ethers.Wallet(privateKey, provider);
}

// Get native token (MTX) balance
export async function getNativeBalance(address: string): Promise<string> {
  const provider = getProvider();
  const balance = await provider.getBalance(address);
  return formatUnits(balance, 18);
}

// Get ERC20 token balance
export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
  const provider = getProvider();
  const contract = new Contract(tokenAddress, ERC20_ABI, provider);
  const decimals = await contract.decimals();
  const balance = await contract.balanceOf(walletAddress);
  return formatUnits(balance, decimals);
}

// Detect token metadata from contract address
export async function detectTokenMetadata(contractAddress: string): Promise<TokenMetadata> {
  const provider = getProvider();
  const contract = new Contract(contractAddress, ERC20_ABI, provider);
  
  try {
    const [name, symbol, decimals] = await Promise.all([
      contract.name(),
      contract.symbol(),
      contract.decimals(),
    ]);
    
    return {
      name,
      symbol,
      decimals: Number(decimals),
    };
  } catch (error) {
    throw new Error("Failed to detect token metadata. Invalid contract address or not an ERC20 token.");
  }
}

// Send native MTX
export async function sendNativeToken(
  privateKey: string,
  to: string,
  amount: string
): Promise<ethers.TransactionResponse> {
  const signer = getSigner(privateKey);
  const value = parseUnits(amount, 18);
  
  const tx = await signer.sendTransaction({
    to,
    value,
  });
  
  return tx;
}

// Send ERC20 token
export async function sendToken(
  privateKey: string,
  tokenAddress: string,
  to: string,
  amount: string,
  decimals: number
): Promise<ethers.TransactionResponse> {
  const signer = getSigner(privateKey);
  const contract = new Contract(tokenAddress, ERC20_ABI, signer);
  const value = parseUnits(amount, decimals);
  
  const tx = await contract.transfer(to, value);
  return tx;
}

// Estimate gas for native transfer
export async function estimateNativeGas(from: string, to: string, amount: string): Promise<string> {
  const provider = getProvider();
  const value = parseUnits(amount, 18);
  
  try {
    const gasEstimate = await provider.estimateGas({
      from,
      to,
      value,
    });
    
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || parseUnits("20", "gwei");
    const totalCost = gasEstimate * gasPrice;
    
    return formatUnits(totalCost, 18);
  } catch (error) {
    // Return default estimate if estimation fails
    return "0.001";
  }
}

// Estimate gas for token transfer
export async function estimateTokenGas(
  privateKey: string,
  tokenAddress: string,
  to: string,
  amount: string,
  decimals: number
): Promise<string> {
  const signer = getSigner(privateKey);
  const contract = new Contract(tokenAddress, ERC20_ABI, signer);
  const value = parseUnits(amount, decimals);
  
  try {
    const gasEstimate = await contract.transfer.estimateGas(to, value);
    const provider = getProvider();
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || parseUnits("20", "gwei");
    const totalCost = gasEstimate * gasPrice;
    
    return formatUnits(totalCost, 18);
  } catch (error) {
    // Return default estimate if estimation fails
    return "0.002";
  }
}

// Get all token balances for a wallet
export async function getAllTokenBalances(
  walletAddress: string,
  customTokens: Array<{ contractAddress: string; name: string; symbol: string; decimals: number; logoUrl?: string }>
): Promise<TokenBalance[]> {
  const config = getNetworkConfig();
  const balances: TokenBalance[] = [];
  
  // Get native MTX balance
  const nativeBalance = await getNativeBalance(walletAddress);
  balances.push({
    contractAddress: null,
    name: config.nativeToken,
    symbol: config.nativeToken,
    decimals: 18,
    balance: nativeBalance,
  });
  
  // Get custom token balances
  for (const token of customTokens) {
    try {
      const balance = await getTokenBalance(token.contractAddress, walletAddress);
      balances.push({
        contractAddress: token.contractAddress,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals,
        balance,
        logoUrl: token.logoUrl,
      });
    } catch (error) {
      console.error(`Failed to fetch balance for ${token.symbol}:`, error);
    }
  }
  
  return balances;
}

// Format address for display (0x1234...5678)
export function truncateAddress(address: string, chars = 4): string {
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

// Validate Ethereum address
export function isValidAddress(address: string): boolean {
  return ethers.isAddress(address);
}
