# Wallet ↔ Smart Contract Mapping Logic
### Overview

This document describes the interaction logic between user wallets (MetaMask) and deployed smart contracts on the Ethereum Sepolia testnet.

It explains how transactions are:

- Initiated

- Signed

- Executed

- Logged via events

- Confirmed on-chain

This mapping ensures secure, role-based, and auditable interaction between users and smart contracts.

## 1. Wallet Layer (User Interaction)

The user interacts with the decentralized application (dApp) through MetaMask.

### Responsibilities of the Wallet

- Securely stores the private key

- Signs transactions

- Pays gas fees

- Submits transactions to the RPC provider

### Example Transaction Initiation (Hardhat / Frontend)
await escrow.deposit({ value: ethers.parseEther("1") });
### What Happens Here?

1.MetaMask prompts user for confirmation

2.Wallet signs the transaction using private key

3.Gas fee is calculated

4.Signed transaction is sent to Ethereum network

---

## 2. Contract Layer (Smart Contract Execution)

Once the transaction reaches the blockchain:

- Smart contract function executes

- Input parameters are validated using require

- Contract state variables are updated

- Events are emitted

- Transaction is included in a block

### Example Solidity Function
function deposit() external payable {
    require(msg.value > 0, "Must send ETH");
    emit Deposited(msg.sender, msg.value);
}
### Key Points

- msg.sender represents the wallet address

- State changes consume gas

- Events log blockchain activity

---

## 3. Event Layer (Blockchain Logging)

Events act as a communication bridge between:

- Smart contract

- Frontend UI

- Backend services

### Example Event
event Deposited(address indexed sender, uint256 amount);
### Why Events Are Important

- Provide transaction logs

- Enable frontend updates

- Used for analytics and indexing

- Cheaper than storing additional state

Frontend applications can listen for event logs to update UI in real time.

---
## 4. Confirmation Layer (Transaction Finality)

After execution:

- A validator includes the transaction in a block

- The transaction hash becomes permanent

- Block confirmations increase

- The UI updates transaction status

### Transaction Lifecycle Summary
Wallet → Sign → RPC → Ethereum Network → Smart Contract → Event → Block → Confirmation

---
## 5. Wallet ↔ Contract Mapping Flow
### Step-by-Step Mapping

- User selects account in MetaMask

- Wallet address becomes msg.sender

- Contract validates role-based access

- State changes occur

- Gas is deducted from sender

- Event logs record transaction

### Role-Based Mapping Example (Escrow Contract)
| Role    | Wallet Mapping     | Permission        |
| ------- | ------------------ | ----------------- |
| Buyer   | `msg.sender`       | Deposit funds     |
| Arbiter | `connect(arbiter)` | Release funds     |
| Seller  | Receives ETH       | Withdrawal target |

### Example Mapping in Test
escrow.connect(arbiter).release();
### Explanation

- Arbiter wallet executes release()

- Contract verifies arbiter authorization

- Funds are transferred to seller

---

## 6. Security Considerations

To ensure secure wallet-contract interaction:

- Private keys are never stored in frontend

- .env file is excluded via .gitignore

- Access control is enforced using require()

- Role-based execution is validated on-chain

- Events are used for transparent audit tracking
  
---

## 7. Optimization Opportunities

To improve gas efficiency:

- Use external visibility for cheaper function calls

- Minimize storage writes (most expensive operation)

- Emit events instead of storing unnecessary data

- Reduce redundant validations

- Avoid unnecessary state changes

### Architecture Overview
<pre> ## Architecture Overview ``` User Wallet (MetaMask) ↓ Transaction Signed ↓ RPC Provider (Alchemy) ↓ Ethereum Sepolia Network ↓ Smart Contract Execution ↓ Event Emission ↓ Block Confirmation ↓ Frontend Update ``` </pre>



## Transaction Field Definitions

| Field | Type | Description |
|---|---|---|
| tx_id | string | Unique blockchain transaction identifier |
| sender | Ethereum address | Wallet initiating transaction |
| recipient | Ethereum address | Wallet or contract receiving transaction |
| amount | string | ETH/token amount |
| chain | enum | Blockchain network |
| status | enum | Current transaction state |
| timestamp | ISO-8601 datetime | Time transaction was created |

## Transaction Statuses

### pending
Transaction has been submitted but is not yet confirmed.

### confirmed
Transaction has been included in a block and confirmed.

### failed
Transaction execution failed or reverted.

## On-Chain vs Off-Chain

### On-chain

- Transaction hash
- Sender
- Recipient
- Amount
- Contract state
- Blockchain events
- Block information

### Off-chain

- User profile
- KYC documents
- Personal information
- Application metadata
- UI information

Sensitive KYC information is never stored directly on-chain.
Only a cryptographic hash/reference is stored.

## Wallet Mapping

Wallet addresses are used as the blockchain identity anchor.

Wallet
→ DID
→ KYC hash
→ Blockchain transaction

The wallet address is represented by `msg.sender` during smart contract execution.