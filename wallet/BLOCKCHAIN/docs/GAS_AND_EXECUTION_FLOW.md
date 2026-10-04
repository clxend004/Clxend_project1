# Gas Usage & Execution Flow Documentation
## Overview

### This document provides:

Gas usage metrics for smart contract operations

Transaction lifecycle explanation

Preliminary gas optimization observations

All measurements were captured using Hardhat Gas Reporter during local testing.

---

##  Gas Usage Metrics
### Contract Deployment

| Contract | Gas Used    | Notes                                     |
| -------- | ----------- | ----------------------------------------- |
| Escrow   | 600,357 gas | Includes constructor logic and role setup |
| Lock     | 326,112 gas | Simpler contract structure                |

Deployment consumes the highest gas due to bytecode storage on-chain.

### Deposit Transaction
| Function  | Gas Used   | Description                            |
| --------- | ---------- | -------------------------------------- |
| deposit() | 22,823 gas | Stores ETH in contract and emits event |

This function consumes gas for:

- State update

- ETH transfer into contract

- Event emission

### Withdrawal / Release Transaction
| Function   | Gas Used   | Description             |
| ---------- | ---------- | ----------------------- |
| release()  | 39,967 gas | Transfers ETH to seller |
| withdraw() | 34,096 gas | Transfers locked funds  |

Withdrawal functions consume slightly more gas because:

- Authorization checks occur

- ETH transfer is executed

- State variables are updated

- Event logs are emitted

## Refund Transaction (Add this)

Your document does not include refund(), but the assignment requires it.

Add this section:

### Refund Transaction
| Function | Gas Used       | Description                                    |
| -------- | -------------- | ---------------------------------------------- |
| refund() | **39,984 gas** | Returns ETH to buyer if escrow conditions fail |

--- 
  
##  Transaction Lifecycle Documentation

The smart contract transaction lifecycle follows a deterministic flow.

### Step-by-Step Flow

1.User initiates transaction from wallet (MetaMask).

2.Wallet signs transaction using private key.

3.Signed transaction is sent to RPC provider (Alchemy).

4.Transaction is broadcast to Ethereum network (Sepolia).

5.Smart contract function executes.

6.Contract updates state and emits events.

7.Validator includes transaction in block.

8.Transaction receives confirmations.

9.Frontend updates status.

### Execution Flow Diagram

User Wallet (MetaMask)
        |
        v
Transaction Signed
        |
        v
RPC Provider (Alchemy)
        |
        v
Ethereum Sepolia Network
        |
        v
Smart Contract Execution
        |
        v
Event Emission
        |
        v
Block Confirmation
        |
        v
Frontend Update

---

## Storage-Heavy Operations

The following operations contribute the most gas usage:

### Storage Writes

Updating contract state variables consumes significant gas.

#### Example:

released = true;
refunded = true;

Each storage write (SSTORE) may cost up to 20,000 gas.

### Mapping Updates

If mappings or balances are updated, additional gas is consumed.

### Ether Transfers

ETH transfers also increase gas usage because value is moved between accounts.

---

## Gas Optimization Applied

The following improvements were considered to reduce gas consumption:

### Immutable Variables

Addresses such as buyer and seller can be declared as immutable.

address public immutable buyer;
address public immutable seller;

#### Benefit:

- Reduces storage reads

- Saves gas during execution

### Custom Errors Instead of Require Strings

Using custom errors reduces bytecode size.

#### Example:

Instead of

require(msg.sender == buyer, "Not buyer");

Use

error NotBuyer();
if(msg.sender != buyer) revert NotBuyer();

#### Benefit:

Lower gas cost for revert conditions

---

## Preliminary Gas Optimization Notes

Based on current implementation:

### Storage Optimization

- Minimize writes to storage variables (most expensive operation).

- Avoid unnecessary state updates.

### Function Visibility

- Use external instead of public when possible.

- Reduces gas cost for external calls.

### Event Usage

- Prefer emitting events over storing additional data.

- Events are cheaper than persistent storage.

### Access Control Efficiency

- Avoid redundant require() validations.

- Keep authorization logic concise.

### Deployment Optimization

- Reduce contract size.

- Avoid unused variables and functions.
 
---

## Final Gas Metrics Summary

| Operation           | Gas Used    |
| ------------------- | ----------- |
| Contract Deployment | 600,357 gas |
| deposit()           | 22,823 gas  |
| release()           | 39,967 gas  |
| refund()            | 39,984 gas  |

### Performance Insight

- Deployment consumes the most gas due to contract bytecode storage.

- deposit() is cheaper because it performs minimal state updates.

- release() and refund() consume more gas due to ETH transfers and storage updates.

---

## Observations

- Deployment consumes the highest gas due to contract bytecode storage.

- ETH transfer operations increase gas usage.

- Role-based validation adds minor overhead.

- Event emission is relatively efficient compared to storage updates.
