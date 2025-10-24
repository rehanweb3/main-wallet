import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { ethers } from "ethers";
import env from "dotenv";

env.config();
// WebSocket client tracking
const clients = new Set<WebSocket>();

// Get provider for blockchain interaction
function getProvider(): ethers.JsonRpcProvider {
  const rpcUrl = process.env.VITE_RPC_URL || "https://rpc.mintrax.network";
  return new ethers.JsonRpcProvider(rpcUrl);
}

// Setup block listener using polling (fallback for non-WebSocket RPC endpoints)
let blockPollingInterval: NodeJS.Timeout | null = null;
let lastBlockNumber = 0;

async function setupBlockListener() {
  try {
    const provider = getProvider();
    
    // Try to get initial block number
    lastBlockNumber = await provider.getBlockNumber();
    console.log(`Initial block number: ${lastBlockNumber}`);
    
    // Poll for new blocks every 5 seconds
    blockPollingInterval = setInterval(async () => {
      try {
        const currentBlock = await provider.getBlockNumber();
        
        if (currentBlock > lastBlockNumber) {
          console.log(`New block detected: ${currentBlock}`);
          lastBlockNumber = currentBlock;
          
          // Broadcast to all connected WebSocket clients
          const message = JSON.stringify({
            type: "newBlock",
            blockNumber: currentBlock,
            timestamp: Date.now(),
          });
          
          clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
        }
      } catch (error) {
        console.error("Error polling for new blocks:", error);
      }
    }, 5000); // Poll every 5 seconds
    
    console.log("Block listener setup complete (using polling)");
  } catch (error) {
    console.error("Failed to setup block listener:", error);
    // Continue without block listener if it fails
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    clients.add(ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });

    // Send initial connection confirmation
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "connected",
        timestamp: Date.now(),
      }));
    }
  });

  // Setup block listener
  setupBlockListener();

  // API Routes

  // Get transactions for a wallet (split by sent/received)
  app.get("/api/transactions/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const allTransactions = await storage.getTransactionsByWallet(walletAddress);
      
      // Split transactions by type
      const sent = allTransactions.filter(tx => tx.type === 'send');
      const received = allTransactions.filter(tx => tx.type === 'receive');
      
      res.json({ sent, received });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get transaction by hash
  app.get("/api/transaction/:txHash", async (req, res) => {
    try {
      const { txHash } = req.params;
      const transaction = await storage.getTransactionByHash(txHash);
      
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Record a new transaction
  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      // Broadcast new transaction to WebSocket clients
      const message = JSON.stringify({
        type: "newTransaction",
        transaction,
        timestamp: Date.now(),
      });
      
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      
      res.json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Update transaction status
  app.patch("/api/transaction/:txHash/status", async (req, res) => {
    try {
      const { txHash } = req.params;
      const { status, blockNumber } = req.body;
      
      await storage.updateTransactionStatus(txHash, status, blockNumber);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get native balance (proxied to avoid CORS issues)
  app.get("/api/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const provider = getProvider();
      const balance = await provider.getBalance(address);
      
      res.json({
        balance: balance.toString(),
        formatted: ethers.formatEther(balance),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: Date.now(),
      wsConnections: clients.size,
    });
  });

  return httpServer;
}
