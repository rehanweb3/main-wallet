import { ethers } from "ethers";
import { storage } from "./storage";
import type { Transaction } from "@shared/schema";
import type { WebSocket } from "ws";

export class TransactionMonitor {
  private provider: ethers.JsonRpcProvider;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private clients: Set<WebSocket>;
  private isRunning = false;
  private checkIntervalMs: number;

  constructor(rpcUrl: string, clients: Set<WebSocket>, checkIntervalMs = 10000) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.clients = clients;
    this.checkIntervalMs = checkIntervalMs;
  }

  start(): void {
    if (this.isRunning) {
      console.log("Transaction monitor is already running");
      return;
    }

    console.log("Starting transaction monitor...");
    this.isRunning = true;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkPendingTransactions();
      } catch (error) {
        console.error("Error in transaction monitoring cycle:", error);
      }
    }, this.checkIntervalMs);

    console.log(`Transaction monitor started (checking every ${this.checkIntervalMs}ms)`);
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isRunning = false;
      console.log("Transaction monitor stopped");
    }
  }

  private async checkPendingTransactions(): Promise<void> {
    try {
      const pendingTxs = await storage.getPendingTransactions();
      
      if (pendingTxs.length === 0) {
        return;
      }

      console.log(`Checking ${pendingTxs.length} pending transaction(s)...`);

      for (const tx of pendingTxs) {
        await this.checkTransaction(tx);
      }
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
    }
  }

  private async checkTransaction(tx: Transaction): Promise<void> {
    try {
      const receipt = await this.provider.getTransactionReceipt(tx.txHash);
      
      if (!receipt) {
        const currentBlock = await this.provider.getBlockNumber();
        const txAge = currentBlock - (tx.blockNumber || currentBlock);
        
        if (txAge > 50) {
          console.log(`Transaction ${tx.txHash} appears to be dropped (age: ${txAge} blocks)`);
          await this.updateTransactionAsFailed(tx, "Transaction not found or dropped");
        }
        return;
      }

      const updates: Partial<Transaction> = {
        gasUsed: receipt.gasUsed?.toString() || null,
        gasPrice: receipt.gasPrice?.toString() || null,
        blockNumber: receipt.blockNumber || null,
      };

      if (receipt.status === 0) {
        updates.status = "failed";
        console.log(`Transaction ${tx.txHash} failed`);
      } else if (receipt.status === 1) {
        updates.status = "success";
        console.log(`Transaction ${tx.txHash} confirmed successfully`);
      }

      await storage.updateTransactionDetails(tx.txHash, updates);

      const updatedTx = await storage.getTransactionByHash(tx.txHash);
      if (updatedTx) {
        this.broadcastTransactionUpdate(updatedTx);
      }

    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
        console.log(`Network error checking transaction ${tx.txHash}, will retry`);
        return;
      }
      console.error(`Error checking transaction ${tx.txHash}:`, error);
    }
  }

  private async updateTransactionAsFailed(tx: Transaction, reason: string): Promise<void> {
    await storage.updateTransactionDetails(tx.txHash, {
      status: "failed",
    });

    const updatedTx = await storage.getTransactionByHash(tx.txHash);
    if (updatedTx) {
      this.broadcastTransactionUpdate(updatedTx);
    }
  }

  private broadcastTransactionUpdate(transaction: Transaction): void {
    const message = JSON.stringify({
      type: "transactionUpdate",
      transaction,
      timestamp: Date.now(),
    });

    let successCount = 0;
    this.clients.forEach((client) => {
      if (client.readyState === 1) {
        try {
          client.send(message);
          successCount++;
        } catch (error) {
          console.error("Error broadcasting to client:", error);
        }
      }
    });

    if (successCount > 0) {
      console.log(`Broadcast transaction update for ${transaction.txHash} to ${successCount} client(s)`);
    }
  }

  async checkTransactionOnce(txHash: string): Promise<void> {
    const tx = await storage.getTransactionByHash(txHash);
    if (tx && tx.status === "pending") {
      await this.checkTransaction(tx);
    }
  }
}
