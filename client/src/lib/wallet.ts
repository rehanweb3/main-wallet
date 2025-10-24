import { ethers } from "ethers";
import * as bip39 from "bip39";
import CryptoJS from "crypto-js";
import type { WalletData } from "@shared/schema";

const STORAGE_KEY = "mintrax_wallet";
const TOKENS_KEY = "mintrax_tokens";

export interface StoredWallet {
  address: string;
  encryptedData: string;
}

// Generate new wallet with mnemonic
export function generateWallet(): WalletData {
  const mnemonic = bip39.generateMnemonic();
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic,
  };
}

// Import wallet from mnemonic
export function importFromMnemonic(mnemonic: string): WalletData {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }
  
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic,
  };
}

// Import wallet from private key
export function importFromPrivateKey(privateKey: string): WalletData {
  // Add 0x prefix if missing
  const formattedKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;
  const wallet = new ethers.Wallet(formattedKey);
  
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}

// Encrypt and save wallet to localStorage
export function saveWallet(walletData: WalletData, password: string): void {
  const data = JSON.stringify(walletData);
  const encrypted = CryptoJS.AES.encrypt(data, password).toString();
  
  const stored: StoredWallet = {
    address: walletData.address,
    encryptedData: encrypted,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

// Load and decrypt wallet from localStorage
export function loadWallet(password: string): WalletData | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const { encryptedData } = JSON.parse(stored) as StoredWallet;
    const decrypted = CryptoJS.AES.decrypt(encryptedData, password).toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      throw new Error("Invalid password");
    }
    
    return JSON.parse(decrypted) as WalletData;
  } catch (error) {
    throw new Error("Invalid password or corrupted wallet data");
  }
}

// Check if wallet exists in storage
export function hasStoredWallet(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Get stored wallet address without decrypting
export function getStoredAddress(): string | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    const { address } = JSON.parse(stored) as StoredWallet;
    return address;
  } catch {
    return null;
  }
}

// Clear wallet from storage
export function clearWallet(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(TOKENS_KEY);
}

// Token storage helpers
export interface StoredToken {
  contractAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
}

export function saveCustomTokens(tokens: StoredToken[]): void {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
}

export function loadCustomTokens(): StoredToken[] {
  const stored = localStorage.getItem(TOKENS_KEY);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored) as StoredToken[];
  } catch {
    return [];
  }
}

export function addCustomToken(token: StoredToken): void {
  const tokens = loadCustomTokens();
  const exists = tokens.some(t => t.contractAddress.toLowerCase() === token.contractAddress.toLowerCase());
  
  if (!exists) {
    tokens.push(token);
    saveCustomTokens(tokens);
  }
}

export function removeCustomToken(contractAddress: string): void {
  const tokens = loadCustomTokens();
  const filtered = tokens.filter(t => t.contractAddress.toLowerCase() !== contractAddress.toLowerCase());
  saveCustomTokens(filtered);
}
