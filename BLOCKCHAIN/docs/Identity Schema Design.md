## 🔷 1. Introduction

Decentralized Identity (DID) is a system that allows users to own and control their identity without relying on a central authority. In this project, we design a DID schema where:

Blockchain (on-chain) stores minimal, secure identity data
Off-chain storage stores sensitive and large data (like KYC documents)

This improves:

- 🔐 Security
- ⚡ Performance
- 🔒 Privacy
- 
---

## 🔷 2. DID Identity Schema (On-Chain)

The following schema defines how identity is stored on the blockchain:

```json
{
  "did_id": "did:project:001",
  "wallet_address": "0xABC123DEF456...",
  "kyc_hash": "QmXyz123HashValue",
  "status": "VERIFIED",
  "created_timestamp": 1710000000
}
```

---

## 🔷 3. Field Description

| Field                 | Description                                         |
| --------------------- | --------------------------------------------------- |
| **did_id**            | Unique decentralized identity ID                    |
| **wallet_address**    | User’s blockchain wallet address                    |
| **kyc_hash**          | Hash reference of KYC data stored off-chain         |
| **status**            | Verification status (PENDING / VERIFIED / REJECTED) |
| **created_timestamp** | Time when identity was created                      |

---
## 🔷 4. On-Chain vs Off-Chain Data Separation
### ✅ On-Chain Data (Stored in Blockchain)
- did_id
- wallet_address
- kyc_hash
- status
- created_timestamp

👉 Reason: Small, secure, and needed for verification

### ❌ Off-Chain Data (Stored in Database / IPFS)
- Name
- Aadhaar / PAN details
- Address
- KYC documents (PDF, images)

👉 Reason: Sensitive and large data (not suitable for blockchain)

---

## 🔷 5. Hash-Based Reference Model

Instead of storing sensitive KYC data directly on the blockchain:

### 🔹 Process:
1.User uploads KYC documents \
2.Data is stored off-chain (IPFS / Database) \
3.A hash is generated from the data \
4.Only the hash is stored on the blockchain 
### 🔹 Example:
KYC Document → Generate Hash → Store Hash On-Chain
🔹 Advantage:
- 🔒 Privacy protected
- ⚡ Lightweight blockchain storage
- 🔐 Data integrity (if data changes → hash changes)

---

## 6. Identity Storage Flow
### 🔄 Step-by-Step Process:
1.User registers with wallet address \
2.User submits KYC details \
3.KYC data stored off-chain \
4.Hash of KYC generated \
5.DID record created on blockchain \
6.Verification authority updates status 

---

## 🔷 7. Smart Contract Structure (Solidity)

Below is a basic smart contract structure for storing DID:

```solidity
pragma solidity ^0.8.0;

struct Identity {
    string did_id;
    address wallet_address;
    string kyc_hash;
    string status;
    uint256 created_timestamp;
}

mapping(address => Identity) public identities;

function createIdentity(
    string memory _did,
    string memory _kycHash
) public {
    identities[msg.sender] = Identity(
        _did,
        msg.sender,
        _kycHash,
        "PENDING",
        block.timestamp
    );
}
```

