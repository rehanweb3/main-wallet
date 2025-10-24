import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Wallet schema - stores encrypted wallet data
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  encryptedPrivateKey: text("encrypted_private_key").notNull(),
  encryptedMnemonic: text("encrypted_mnemonic"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom tokens added by user
export const customTokens = pgTable("custom_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  contractAddress: text("contract_address").notNull(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimals: integer("decimals").notNull(),
  logoUrl: text("logo_url"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

// Transaction history
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  walletAddress: text("wallet_address").notNull(),
  txHash: text("tx_hash").notNull().unique(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  value: text("value").notNull(), // stored as string to preserve precision
  gasUsed: text("gas_used"),
  gasPrice: text("gas_price"),
  blockNumber: integer("block_number"),
  timestamp: timestamp("timestamp").notNull(),
  status: text("status").notNull(), // 'pending', 'success', 'failed'
  tokenAddress: text("token_address"), // null for native MTX
  tokenSymbol: text("token_symbol"),
  tokenDecimals: integer("token_decimals"),
  type: text("type").notNull(), // 'send', 'receive'
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertCustomTokenSchema = createInsertSchema(customTokens).omit({
  id: true,
  addedAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof wallets.$inferSelect;
export type InsertCustomToken = z.infer<typeof insertCustomTokenSchema>;
export type CustomToken = typeof customTokens.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Frontend-only types
export interface WalletData {
  address: string;
  privateKey: string;
  mnemonic?: string;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logoUrl?: string;
}

export interface TokenBalance {
  contractAddress: string | null; // null for native MTX
  name: string;
  symbol: string;
  decimals: number;
  balance: string;
  logoUrl?: string;
}

export interface TransactionSummary {
  from: string;
  to: string;
  amount: string;
  gasEstimate: string;
  tokenSymbol: string;
  tokenAddress?: string;
}

export interface NetworkConfig {
  name: string;
  rpc: string;
  chainId: number;
  nativeToken: string;
  explorer: string;
}
