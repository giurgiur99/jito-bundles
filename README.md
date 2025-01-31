# Jito Bundles Demo: Sequential Transaction Execution on Solana

This project demonstrates how to use Jito Bundles to execute sequential, atomic transactions on Solana. The example shows a "surprise reward" system where Alice sends SOL to Bob and automatically receives tokens in return.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Two Solana wallets (Alice and Bob)

## Installation

### 1. Install dependencies

```
npm install
```

### 2. Create a `.env` file and copy the contents of `.env.example`

```
ALICE_SECRET_KEY=
BOB_SECRET_KEY=
RPC_URL=https://solana-testnet-rpc.publicnode.com
JITO_URL=https://ny.testnet.block-engine.jito.wtf/api/v1
JITO_TIP_ACCOUNT_PUBKEY=BkMx5bRzQeP6tUZgzEs3xeDWJfQiLYvNDqSgmGZKYJDq
```

## Features

- Atomic and sequential transaction execution using Jito Bundles
- Token minting and transfer functionality
- SOL transfers

## How It Works

1. **Token Minting**: Bob mints tokens that will be used as a reward.
2. **Transaction Creation**: The app creates three transactions:
   - Alice sending SOL to Bob
   - Bob sending tokens to Alice
   - Jito tip transaction
3. **Bundle Execution**: Transactions are bundled and sent to Jito.

## Usage

1. Set up your environment variables as described above.
2. Run the application:

   ```sh
   npm start
   ```

3. Monitor the console output for bundle status:

   - Bundle sent confirmation
   - Bundle status updates
   - Final transaction confirmation

   ```
   ✅ Bundle sent: bundle_id
   🔄 JITO bundle status: Pending
   🔄 JITO bundle status: Pending
   ✅ JITO bundle landed
   📝 Transactions: tx1, tx2, tx3
   ```

## Important Notes

- **Minimum tip requirement**: 1000 lamports for bundle processing.
- **Bundle execution on testnet** is slower than mainnet.
- **Increase tip amount** for faster processing during high traffic.
- **All transactions in a bundle must succeed** for any to be processed.

## Testing

1. Ensure you have sufficient SOL in both Alice and Bob's wallets.
2. Run the application.
3. Check wallet balances to confirm:
   - SOL transfer from Alice to Bob
   - Token transfer from Bob to Alice
   - Tip payment to Jito

## Network Considerations

- **Testnet**: Expect longer bundle landing times.
- **Mainnet**: Faster execution, but requires real SOL.
- **Tip Amount**: Adjust based on network congestion.
