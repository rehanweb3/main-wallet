# Mintrax Wallet - Web3 Wallet for MintraxChain

## Overview
A modern, secure Web3 wallet application built specifically for the MintraxChain network. Users can create/import wallets, manage MTX tokens and custom ERC20 tokens, send/receive transactions, and view transaction history with live balance updates.

## Current State
- **Phase**: Task 1 Complete (Schema & Frontend)
- **Status**: All frontend components built with glassmorphism design
- **Next**: Backend implementation with WebSocket support

## Recent Changes
- Created complete data schema for wallets, tokens, and transactions
- Built all React components with exceptional visual quality:
  - WalletSetup: Create/import wallet with mnemonic and private key support
  - Dashboard: Balance display, QR code, token list
  - AddTokenDialog: Auto-detect ERC20 token metadata
  - SendDialog: Multi-step send flow with gas estimation
  - ReceiveDialog: QR code and address sharing
  - TransactionHistory: List view with detail modals
  - TransactionReceipt: Full receipt page
- Implemented Web3 utilities (ethers.js v6) for blockchain interaction
- Added encrypted localStorage wallet management with crypto-js
- Configured network from environment variables

## Project Architecture

### Frontend (Complete)
- **Framework**: React + TypeScript + Vite
- **Routing**: Wouter
- **State Management**: TanStack Query
- **Styling**: Tailwind CSS + Shadcn UI with glassmorphism theme
- **Web3**: ethers.js v6
- **Encryption**: crypto-js for wallet storage

### Backend (In Progress)
- **Server**: Express.js
- **Storage**: In-memory storage for transactions cache
- **WebSocket**: Real-time balance updates on new blocks
- **Network**: MintraxChain (Chain ID: 478549)

### Key Features
1. **Wallet Management**
   - Create new wallet with 12-word mnemonic
   - Import wallet via mnemonic or private key
   - Encrypted storage with password protection
   - QR code generation for receiving

2. **Token Management**
   - Native MTX balance display
   - Add custom ERC20 tokens by contract address
   - Auto-detect token metadata (name, symbol, decimals)
   - Display all token balances

3. **Transactions**
   - Send MTX and custom tokens
   - Multi-step send wizard with validation
   - Gas estimation before confirmation
   - Transaction receipt with full details
   - Transaction history with status badges

4. **Live Updates**
   - WebSocket connection to blockchain
   - Auto-refresh balances on new blocks
   - Real-time transaction status updates

## Network Configuration
All network settings loaded from environment variables:
- `VITE_NETWORK_NAME`: MintraxChain
- `VITE_RPC_URL`: https://rpc.mintrax.network
- `VITE_CHAIN_ID`: 478549
- `VITE_NATIVE_TOKEN`: MTX
- `VITE_EXPLORER_URL`: https://explorer.mintrax.network

## File Structure
```
client/
  src/
    components/
      WalletSetup.tsx - Wallet creation/import UI
      Dashboard.tsx - Main dashboard with balance & tokens
      AddTokenDialog.tsx - Add custom tokens
      SendDialog.tsx - Multi-step send flow
      ReceiveDialog.tsx - QR code & address display
      TransactionHistory.tsx - Transaction list
      TransactionDetailModal.tsx - Transaction details modal
    pages/
      TransactionReceipt.tsx - Full receipt page
    lib/
      wallet.ts - Wallet encryption & storage
      web3.ts - Blockchain interaction utilities
      network.ts - Network configuration
shared/
  schema.ts - TypeScript types & schemas
server/
  routes.ts - API endpoints (to be implemented)
  storage.ts - Transaction storage interface
```

## User Preferences
- Design: Glassmorphism with purple/blue gradient accents
- Font: Inter for UI, JetBrains Mono for addresses/hashes
- Theme: Light/dark mode support (pre-configured in CSS)

## Development Notes
- All blockchain interactions use ethers.js v6
- Wallet data encrypted with AES before localStorage
- Network config must never be hardcoded
- Transaction history cached in memory for performance
- WebSocket provider for live balance updates
