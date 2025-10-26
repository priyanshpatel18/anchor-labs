# AnchorLabs

A web-based development environment for testing and interacting with Solana programs built with the Anchor framework.

## Overview

AnchorLabs provides a graphical interface for developers to interact with their Anchor programs without writing client-side code. Upload your IDL, connect your wallet, and execute instructions directly from your browser.

## Features

### Program Management
- Initialize programs by uploading Anchor IDL files
- Support for multiple Solana clusters (mainnet, devnet, testnet, localnet)
- Automatic program detection and configuration
- Persistent program state across sessions

### Account Management
- View all accounts associated with your program
- Fetch and display account data with automatic deserialization
- Filter accounts by type
- Copy account addresses and data

### Instruction Execution
- Interactive forms for all program instructions
- Automatic form generation based on IDL definitions
- Support for complex account resolution and constraints
- Account derivation for PDA (Program Derived Addresses)
- Wallet integration for transaction signing
- Transaction result viewing with signature links

### Transaction History
- View recent transactions
- Direct links to Solana explorers
- Transaction status tracking

## Technology Stack

- Next.js 15 with App Router
- React 18
- TypeScript
- Anchor/Solana Web3.js
- Zustand for state management
- Tailwind CSS with shadcn/ui components
- Solana Wallet Adapter

## Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Development

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Initialize a Program

1. Navigate to the home page
2. Upload your Anchor IDL JSON file
3. Configure your RPC endpoint and cluster
4. Connect your Solana wallet
5. Click "Initialize Program"

### Execute Instructions

1. Go to the Instructions page
2. Select an instruction from your program
3. Fill in the required parameters
4. The system will automatically resolve account constraints
5. Sign the transaction with your wallet
6. View the transaction result

### View Accounts

1. Navigate to the Accounts page
2. Browse all accounts by type
3. Click on an account to view its data
4. Copy account addresses or data as needed

## Program Store

The application uses Zustand with persistence middleware to maintain program state. Program details, including the IDL and configuration, are stored in browser localStorage and automatically restored on page reload.

## Account Resolution

AnchorLabs automatically handles:
- PDA derivation based on seeds defined in the IDL
- Account constraint resolution (mut, signer, init, etc.)
- Associated token account creation
- System program and token program references

## RPC Configuration

Default commitment level is set to "confirmed". You can configure:
- Custom RPC endpoints
- Commitment levels (processed, confirmed, finalized)
- Connection timeout settings

## License
This project is licensed under the [MIT License](LICENSE).

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.