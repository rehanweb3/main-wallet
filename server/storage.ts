import type { Transaction, InsertTransaction } from "@shared/schema";
import { transactions } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql as drizzleSql } from "drizzle-orm";

export interface IStorage {
  // Transaction methods
  getTransactionsByWallet(walletAddress: string): Promise<Transaction[]>;
  getTransactionByHash(txHash: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(txHash: string, status: string, blockNumber?: number): Promise<void>;
}

export class PostgresStorage implements IStorage {
  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    const result = await db
      .select()
      .from(transactions)
      .where(drizzleSql`lower(${transactions.walletAddress}) = lower(${walletAddress})`)
      .orderBy(desc(transactions.timestamp));
    return result;
  }

  async getTransactionByHash(txHash: string): Promise<Transaction | undefined> {
    const result = await db
      .select()
      .from(transactions)
      .where(drizzleSql`lower(${transactions.txHash}) = lower(${txHash})`)
      .limit(1);
    return result[0];
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const result = await db
      .insert(transactions)
      .values(insertTransaction)
      .returning();
    return result[0];
  }

  async updateTransactionStatus(txHash: string, status: string, blockNumber?: number): Promise<void> {
    const updateData: Partial<Transaction> = { status };
    if (blockNumber !== undefined) {
      updateData.blockNumber = blockNumber;
    }
    
    await db
      .update(transactions)
      .set(updateData)
      .where(drizzleSql`lower(${transactions.txHash}) = lower(${txHash})`);
  }
}

export const storage = new PostgresStorage();
