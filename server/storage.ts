import type { Transaction, InsertTransaction } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transaction methods
  getTransactionsByWallet(walletAddress: string): Promise<Transaction[]>;
  getTransactionByHash(txHash: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateTransactionStatus(txHash: string, status: string, blockNumber?: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;

  constructor() {
    this.transactions = new Map();
  }

  async getTransactionsByWallet(walletAddress: string): Promise<Transaction[]> {
    const allTransactions = Array.from(this.transactions.values());
    return allTransactions
      .filter(tx => 
        tx.walletAddress.toLowerCase() === walletAddress.toLowerCase()
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async getTransactionByHash(txHash: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      tx => tx.txHash.toLowerCase() === txHash.toLowerCase()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      gasUsed: insertTransaction.gasUsed || null,
      gasPrice: insertTransaction.gasPrice || null,
      blockNumber: insertTransaction.blockNumber || null,
      tokenAddress: insertTransaction.tokenAddress || null,
      tokenSymbol: insertTransaction.tokenSymbol || null,
      tokenDecimals: insertTransaction.tokenDecimals || null,
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async updateTransactionStatus(txHash: string, status: string, blockNumber?: number): Promise<void> {
    const transaction = await this.getTransactionByHash(txHash);
    if (transaction) {
      transaction.status = status;
      if (blockNumber !== undefined) {
        transaction.blockNumber = blockNumber;
      }
      this.transactions.set(transaction.id, transaction);
    }
  }
}

export const storage = new MemStorage();
