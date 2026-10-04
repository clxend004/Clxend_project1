# Blockchain Integration Guide

## Task 5 - Blockchain Documentation

This documentation provides the complete blockchain integration, wallet, DID, transaction, escrow, security, testing, troubleshooting, and handover information required for the CLXEND Blockchain Platform.

The guide is written so that another engineer can understand the existing architecture and reproduce the development and testing workflow.

---

# Project Information

| Property | Value |
|---|---|
| Project | CLXEND Blockchain Platform |
| Role | Blockchain & Transaction Engineer |
| Sprint | Sprint 5 |
| Task | Wallet & Key Management Handover |
| Network | Ethereum Sepolia Testnet |
| Chain ID | `11155111` |
| Architecture | Backend-managed wallet |
| Environment | Development / MVP |

---

# Purpose

The purpose of this guide is to allow another engineer to:

- Understand the CLXEND blockchain architecture
- Understand the wallet lifecycle
- Create and connect wallets
- Understand DID-to-wallet mapping
- Verify DID ownership before transactions
- Understand private-key encryption
- Sign messages
- Sign blockchain transactions
- Submit transactions to Ethereum Sepolia
- Track transaction status
- Integrate with escrow smart contracts
- Understand escrow deposit, release, and refund
- Prevent duplicate transactions
- Troubleshoot wallet and blockchain errors
- Understand the current MVP security architecture
- Reproduce the blockchain testing flow
- Take over the blockchain implementation

---

# Blockchain Components

The CLXEND blockchain system contains the following major components:

- DID Registry
- Wallet Service
- Wallet Storage
- DID Service
- Transaction Service
- Blockchain Service
- Ethereum RPC
- Ethereum Sepolia Network
- Escrow Smart Contract
- Arbiter
- DID Administrator
- User Wallet

---

# Technology Stack

The current blockchain integration uses:

- Node.js
- npm
- JavaScript
- Solidity
- Ethereum
- Ethers.js
- Hardhat
- Ethereum Sepolia Testnet
- REST API
- Smart Contracts
- AES-256-GCM encryption

---

# Network Configuration

The current development blockchain network is:

```text
Network:
Ethereum Sepolia Testnet

Chain ID:
11155111
```

The blockchain service communicates with Ethereum through an RPC endpoint.

---

# System Architecture

The overall CLXEND architecture is:

```text
                     CLXEND Frontend
                            |
                            | REST API
                            v
                     +--------------+
                     |  Backend API |
                     +------+-------+
                            |
              +-------------+-------------+
              |             |             |
              v             v             v
       Wallet Service   DID Service   Transaction Service
              |             |             |
              |             v             v
              |        DID Registry   Blockchain Service
              |                            |
              v                            v
        Wallet Storage                Ethereum RPC
              |                            |
              v                            v
       Encrypted Keys                   Sepolia
                                           |
                              +------------+------------+
                              |                         |
                              v                         v
                         DID Registry             Escrow Contract
```

---

# Main Business Relationship

The most important relationship in the CLXEND system is:

```text
                         USER
                           |
                           v
                          DID
                           |
                           | mapped to
                           v
                    WALLET ADDRESS
                           |
                           | controlled by
                           v
                     PRIVATE KEY
                           |
                           | signs
                           v
                      TRANSACTION
                           |
                           v
                 BLOCKCHAIN / ESCROW
```

---

# Simple Explanation

## DID

The DID answers:

```text
"Who is this user?"
```

## Wallet Address

The wallet address answers:

```text
"Which blockchain account belongs to this identity?"
```

## Private Key

The private key answers:

```text
"Who has authority to sign for this blockchain account?"
```

## Transaction

The transaction answers:

```text
"What action did that account perform?"
```

## Smart Contract

The smart contract answers:

```text
"What blockchain rules must be followed?"
```

---

# Wallet Architecture

The current CLXEND MVP uses a backend-managed wallet architecture.

The frontend does not need to directly manage the private key.

The architecture is:

```text
Frontend
   |
   | REST API
   v
Backend
   |
   v
Wallet Service
   |
   v
Encrypted Wallet Storage
   |
   v
Private Key
   |
   v
Ethereum Signer
   |
   v
Blockchain
```

The raw private key is never returned through the API.

---

# Wallet Lifecycle

The complete wallet lifecycle is:

```text
Create Wallet
      |
      v
Generate Ethereum Wallet
      |
      v
Encrypt Private Key
      |
      v
Store Wallet Mapping
      |
      v
DID <-> Wallet Association
      |
      v
Wallet Verification
      |
      v
Sign Message / Transaction
      |
      v
Send Transaction
      |
      v
Blockchain Confirmation
```

---

# Wallet Creation

When a wallet is created:

1. The backend receives a DID.
2. The wallet service validates the DID.
3. The blockchain/chain is validated.
4. An Ethereum wallet is generated.
5. The private key is encrypted.
6. The encrypted private key is stored.
7. The wallet address is stored.
8. The DID-to-wallet mapping is created.
9. The wallet address can be returned to the application.
10. The raw private key is never returned through the API.

---

# Wallet Record

A conceptual wallet record is:

```json
{
  "did": "did:clxend:test004",
  "wallet_address": "0x...",
  "chain": "sepolia",
  "status": "created",
  "encrypted_private_key": "..."
}
```

The actual private key must never be stored as plaintext.

---

# DID → Wallet Mapping

CLXEND uses the DID as the identity layer and the Ethereum wallet address as the blockchain account.

The relationship is:

```text
DID
 |
 | mapped to
 v
Wallet Address
 |
 | controlled by
 v
Private Key
 |
 | signs
 v
Blockchain Transaction
```

Example:

```text
did:clxend:test004
        |
        v
0xA3e2F389...
        |
        v
Ethereum Wallet
        |
        v
Sepolia Blockchain
```

The DID Registry stores the wallet address associated with the identity.

---

# Current Test Identity

The current verified test identity documented for Sprint 5 is:

```text
DID:
did:clxend:test004

Wallet:
0xA3e2F389aD996148626C8BbA4B8B04368103cCaA
```

---

# DID Verification

Before processing a blockchain transaction, the transaction service validates the sender.

The verification flow is:

```text
Transaction Request
        |
        v
Validate Sender Address
        |
        v
Check DID Registry
        |
        v
Is Wallet Associated With DID?
        |
       / \
     No   Yes
     |     |
  Reject   v
       Is DID VERIFIED?
           |
          / \
        No   Yes
        |     |
     Reject   v
       Check Stored Wallet Mapping
                |
                v
        Sender == DID Wallet?
                |
               / \
             No   Yes
             |     |
          Reject   v
             Continue Transaction
```

This prevents an unrelated wallet from being used with another DID.

---

# DID Mapping Rules

The MVP follows a one-DID-to-wallet association.

Valid:

```text
DID A -> Wallet A
```

Invalid:

```text
DID A -> Wallet B
```

Invalid:

```text
DID B -> Wallet A
```

The system prevents conflicting mappings.

---

# Private-Key Management

The current MVP uses:

```text
AES-256-GCM
```

for private-key encryption.

The encryption flow is:

```text
Private Key
     |
     v
AES-256-GCM Encryption
     |
     v
Encrypted Private Key
     |
     v
Wallet Storage
```

---

# Private-Key Decryption

When a transaction needs to be signed:

```text
Encrypted Private Key
        |
        v
Decrypt Inside Backend
        |
        v
Ethereum Wallet Signer
        |
        v
Sign Transaction
        |
        v
Send To Blockchain
```

The private key must remain inside the backend signing process.

---

# Private-Key Security Rules

The private key must never be:

- Returned from an API response
- Printed in application logs
- Committed to Git
- Included in frontend JavaScript
- Sent to the frontend
- Stored in plaintext

---

# Current MVP Key Management

The current development implementation uses environment configuration.

Conceptually:

```text
.env
 |
 +-- Wallet encryption configuration
 |
 +-- DID admin signing configuration
 |
 +-- Arbiter signing configuration
```

The `.env` file must be excluded from Git.

The current development architecture is:

```text
Application
     |
     v
Environment Secret
     |
     v
Encryption / Signer
     |
     v
Blockchain
```

This architecture is acceptable for the development/MVP test environment.

It should not be considered the final production key-management architecture.

---

# Production Key Management

For production, private keys and encryption secrets should be moved to dedicated secure infrastructure.

Recommended options include:

- KMS
- HSM
- Cloud Secret Manager
- Secure custody/key-management system

The backend should not depend on manually managed plaintext environment secrets for production custody.

---

# Message Signing

The wallet service supports message signing.

The flow is:

```text
Application
    |
    v
Signing Request
    |
    v
Wallet Service
    |
    v
Decrypt Private Key
    |
    v
Create Ethereum Signer
    |
    v
Sign Message
    |
    v
Return Signature
```

The resulting signature can be verified against the wallet address.

---

# Message Signature Verification

Conceptually:

```text
Message
   +
Private Key
   |
   v
Signature
   |
   v
Verification
   |
   v
Wallet Address
```

This demonstrates control of the wallet without exposing the private key.

---

# Transaction Integration

For a normal ETH transfer, the transaction flow is:

```text
POST /transactions
        |
        v
Transaction Service
        |
        +-- Validate Fields
        |
        +-- Verify DID
        |
        +-- Verify Wallet Mapping
        |
        v
Wallet Service
        |
        v
Decrypt Private Key
        |
        v
Blockchain Service
        |
        v
Create Ethereum Transaction
        |
        v
Sign Transaction
        |
        v
Send Through Sepolia RPC
        |
        v
Wait For Confirmation
        |
        v
Update Transaction Status
```

---

# Transaction Information

The application stores transaction information such as:

```text
tx_id
sender
recipient
amount
chain
type
did_id
status
transaction_hash
block_number
timestamp
```

---

# Transaction Lifecycle

A normal transaction follows:

```text
Created
   |
   v
Blockchain Submission
   |
   v
Pending
   |
   +------------------+
   |                  |
   v                  v
Confirmed           Failed
```

---

# Successful Transaction

Example:

```text
Created
   |
   v
Send Transaction
   |
   v
Sepolia
   |
   v
Transaction Mined
   |
   v
Confirmed
```

---

# Failed Transaction

If blockchain submission fails:

```text
Created
   |
   v
Send Transaction
   |
   v
Blockchain Error
   |
   v
Failed
```

The failed transaction remains recorded together with its error information for troubleshooting.

---

# Transaction Validation

The transaction service validates:

- Sender address
- Recipient address
- Amount
- Blockchain
- DID
- DID verification status
- DID-to-wallet mapping
- Wallet availability
- Private-key availability
- Blockchain connectivity

---

# Escrow Integration

Escrow transactions are different from normal ETH transfers.

A normal transaction follows:

```text
Transaction Service
       |
       v
Blockchain Service
       |
       v
ETH Transfer
```

An escrow transaction follows:

```text
Transaction Intent
       |
       v
Escrow Service
       |
       v
Escrow Contract
       |
       v
deposit()
       |
       v
Funded
       |
       v
Arbiter Decision
       |
       +----------------+
       |                |
       v                v
   release()         refund()
       |                |
       v                v
   Released          Refunded
```

---

# Escrow State Machine

The escrow state machine is:

```text
Created
   |
   | deposit()
   v
Funded
   |
   +----------------+
   |                |
   | release()      | refund()
   v                v
Released          Refunded
```

---

# Escrow States

## Created

The escrow record exists but has not been funded.

## Funded

The escrow contract has received the required funds.

## Released

The escrow funds have been released according to the contract rules.

## Refunded

The escrow funds have been refunded according to the contract rules.

`Released` and `Refunded` are final states.

---

# Escrow Business Flow

```text
User
 |
 v
Create Escrow
 |
 v
Escrow Created
 |
 v
Deposit ETH
 |
 v
Escrow Funded
 |
 v
Arbiter Decision
 |
 +-------------------+
 |                   |
 v                   v
Release             Refund
 |                   |
 v                   v
Released            Refunded
```

---

# Wallet Connection

The backend also supports connecting an existing wallet address to a DID.

The flow is:

```text
DID
 |
 v
Wallet Address
 |
 v
Validate Ethereum Address
 |
 v
Validate Chain
 |
 v
Check Existing Mapping
 |
 v
Store DID <-> Wallet Mapping
```

The system prevents conflicting mappings.

---

# Invalid Wallet Mapping

The following mappings are not allowed under the MVP one-to-one mapping rule:

```text
DID A -> Wallet B
```

when the DID is already associated with Wallet A.

Similarly:

```text
DID B -> Wallet A
```

is not allowed when Wallet A is already associated with DID A.

---

# Idempotency

The transaction layer supports an idempotency key.

Example:

```text
idempotency_key:
sprint5-duplicate-test-001
```

The purpose of the idempotency key is to prevent the same transaction request from creating duplicate blockchain transactions.

---

# First Request

The first request follows:

```text
Request 1
   |
   v
Idempotency Key
   |
   v
No Existing Transaction
   |
   v
Create Transaction
   |
   v
Blockchain
```

---

# Duplicate Request

A second request using the same idempotency key follows:

```text
Request 2
   |
   v
Same Idempotency Key
   |
   v
Existing Transaction Found
   |
   v
Return Existing Transaction
   |
   v
NO Second Blockchain Transaction
```

---

# Idempotency Verification

The Sprint 5 verification confirmed:

```text
Count for duplicate key = 1
```

This demonstrates that the tested duplicate request did not create a second stored transaction.

---

# Idempotency MVP Limitation

The current file-based idempotency implementation is suitable for development testing.

It is not sufficient for concurrent production requests.

A production implementation should use a database with:

- Unique idempotency constraint
- Atomic idempotency operation
- Concurrency protection
- Proper transaction handling

---

# Error Handling

The wallet and transaction services validate multiple failure conditions.

---

# Invalid Wallet Address

Example:

```text
Invalid sender address
```

The API should reject the invalid address.

---

# Invalid Recipient

Example:

```text
Invalid recipient address
```

The transaction should not proceed.

---

# Invalid Amount

Example:

```text
Invalid amount.
Amount must be a valid positive ETH value
```

Zero or invalid amounts must not be processed.

---

# Unsupported Blockchain

Example:

```text
Unsupported chain.
Supported chains: sepolia
```

Only supported blockchain networks should be accepted.

---

# Invalid DID

Example:

```text
Wallet is not associated with a DID
```

The transaction should be rejected if the wallet is not associated with a valid DID.

---

# DID Not Verified

Example:

```text
DID is not verified
```

An unverified DID must not be allowed to perform transactions where DID verification is required.

---

# Private-Key Decryption Failure

Example:

```text
Unable to decrypt wallet private key
```

The transaction must not continue when the wallet cannot be securely unlocked.

---

# Insufficient Funds

The blockchain can reject a transaction because the wallet does not contain enough ETH.

The transaction service records:

```text
status = failed
```

---

# Signing Failure

If signing fails:

```text
Request
   |
   v
Wallet Service
   |
   v
Private-Key Decryption
   |
   v
Signing
   |
   v
Failure
```

The transaction must not be marked as confirmed.

Instead:

```text
status = failed
```

The error should be recorded for troubleshooting.

The private-key variable should also be cleared after use as far as practical within the application runtime.

---

# Wallet Security

The following security rules apply to the MVP and future production implementation.

---

# Secrets That Must Never Be Exposed

```text
Private Key
Seed Phrase
Encryption Key
RPC API Secret
```

---

# Files That Must Never Be Committed

```text
.env
private keys
wallet databases containing secrets
secret configuration
```

---

# Information That Must Never Be Logged

```text
private key
seed phrase
decrypted wallet data
encryption key
```

---

# Frontend Information

The frontend should receive only non-sensitive wallet information such as:

```text
wallet address
DID
chain
balance
transaction status
signature result
```

The frontend must not receive:

```text
private key
encrypted private key
encryption secret
```

---

# Governance and Key Ownership

The MVP contains different blockchain roles.

```text
                       CLXEND
                          |
             +------------+------------+
             |            |            |
             v            v            v
        User Wallet    DID Admin    Arbiter
             |            |            |
             |            |            |
          User TX      DID Status    Escrow
                                    Release/
                                    Refund
```

---

# User Wallet

The user wallet is responsible for user-controlled blockchain transactions.

---

# DID Administrator

The DID administrator is responsible for authorized DID status updates.

Example:

```text
PENDING
   |
   v
VERIFIED
```

Only the configured administrator should perform authorized DID status updates.

---

# Arbiter

The arbiter is responsible for escrow resolution.

The escrow flow is:

```text
Funded
   |
   +------------+
   |            |
   v            v
release       refund
   |            |
   v            v
Released     Refunded
```

The arbiter must be strongly protected because control of the arbiter key provides control over escrow resolution.

---

# Operational Commands

## Start Backend

Open the backend directory:

```powershell
cd C:\Users\Acer\vectro\blockchain-architect\api\api
```

Start the backend:

```powershell
npm start
```

Expected output:

```text
Transaction API running on port 3000
```

---

# Install Dependencies

If the backend dependencies are missing:

```powershell
cd api\api
npm install
```

Then:

```powershell
npm start
```

---

# Compile Smart Contracts

From the blockchain project root:

```powershell
cd C:\Users\Acer\vectro\blockchain-architect
```

Run:

```powershell
npx hardhat compile
```

---

# Run Smart Contract Tests

Run:

```powershell
npx hardhat test
```

This executes the available Hardhat test suite.

---

# Run Sepolia Scripts

The general command is:

```powershell
npx hardhat run .\scripts\<script>.js --network sepolia
```

Replace `<script>.js` with the appropriate blockchain script.

---

# Environment Configuration

The application uses environment variables for sensitive configuration.

Example:

```text
.env
```

The `.env` file should contain the required development secrets and blockchain configuration.

Never commit `.env`.

---

# .gitignore

The repository must contain `.env` in `.gitignore`.

Example:

```text
.env
```

This prevents environment secrets from being accidentally committed to Git.

---

# Testing Workflow

The complete wallet demonstration can be performed in this order:

```text
1. Create / Connect Wallet
          |
          v
2. Display Wallet Address
          |
          v
3. Verify DID
          |
          v
4. Check Balance
          |
          v
5. Sign Message
          |
          v
6. Verify Signature
          |
          v
7. Create Transaction
          |
          v
8. Sign / Send Transaction
          |
          v
9. Wait For Blockchain Confirmation
          |
          v
10. Display Transaction Hash / Status
```

---

# Error Demonstration

## Invalid Address

```text
Invalid Address
      |
      v
API Rejects Request
      |
      v
HTTP 400
```

---

# Insufficient Balance

```text
Insufficient Balance
      |
      v
Blockchain Rejects Transaction
      |
      v
Transaction Marked Failed
```

---

# Current Tested Architecture

The Sprint 5 architecture is:

```text
                     +---------------+
                     |   Frontend    |
                     +-------+-------+
                             |
                             v
                     +---------------+
                     |   REST API    |
                     +-------+-------+
                             |
             +---------------+---------------+
             |               |               |
             v               v               v
       Wallet Service   DID Service   Transaction Service
             |               |               |
             |               v               v
             |          DID Registry   Blockchain Service
             |                               |
             v                               v
       Wallet Storage                   Ethereum RPC
             |                               |
             v                               v
      Encrypted Keys                      Sepolia
                                               |
                                  +------------+------------+
                                  |                         |
                                  v                         v
                             DID Registry             Escrow Contract
```

---

# Complete Wallet → DID → Transaction Flow

The complete business relationship is:

```text
                    USER
                      |
                      v
                     DID
                      |
                      | mapped to
                      v
                WALLET ADDRESS
                      |
                      | controlled by
                      v
                 PRIVATE KEY
                      |
                      | signs
                      v
                  TRANSACTION
                      |
                      v
              BLOCKCHAIN / ESCROW
```

---

# Complete Normal Transaction Flow

```text
User
 |
 v
DID
 |
 v
DID Verification
 |
 v
DID -> Wallet Mapping
 |
 v
Transaction Request
 |
 v
Transaction Validation
 |
 v
Wallet Service
 |
 v
Decrypt Private Key
 |
 v
Create Ethereum Transaction
 |
 v
Sign Transaction
 |
 v
Send Through Ethereum RPC
 |
 v
Sepolia Blockchain
 |
 v
Transaction Mined
 |
 v
Transaction Confirmation
 |
 v
Update Transaction Status
```

---

# Complete Escrow Transaction Flow

```text
User
 |
 v
DID Verification
 |
 v
Wallet Verification
 |
 v
Escrow Intent
 |
 v
Escrow Service
 |
 v
Escrow Smart Contract
 |
 v
deposit()
 |
 v
Funded
 |
 v
Arbiter Decision
 |
 +--------------------+
 |                    |
 v                    v
release()           refund()
 |                    |
 v                    v
Released            Refunded
```

---

# Transaction and Smart Contract Relationship

A normal transaction and an escrow transaction are different.

## Normal Transaction

```text
Transaction Service
       |
       v
Blockchain Service
       |
       v
Ethereum
```

## Escrow Transaction

```text
Transaction Intent
       |
       v
Escrow Service
       |
       v
Escrow Smart Contract
       |
       v
Contract State
       |
       +------------+
       |            |
       v            v
    Release       Refund
```

The escrow contract controls the actual escrow funds.

---

# Troubleshooting

## Backend Does Not Start

Run:

```powershell
cd api\api
npm install
npm start
```

Expected:

```text
Transaction API running on port 3000
```

Check:

- Node.js installation
- npm installation
- Dependencies
- Environment variables
- Port availability

---

# DID Verification Fails

Check:

```text
DID Registry address
RPC connection
wallet address
DID status
DID-to-wallet mapping
```

---

# Transaction Fails

Check:

```text
sender DID
wallet mapping
wallet balance
recipient address
amount
chain
RPC connection
```

---

# Escrow Operation Fails

Check:

```text
escrow ID
contract address
current escrow state
arbiter address
blockchain balance
```

Remember the expected state flow:

```text
Created
   |
   v
Funded
   |
   +------------+
   |            |
   v            v
Released     Refunded
```

`Released` and `Refunded` are final states.

---

# Security Checklist

Before pushing code to GitHub, verify:

```text
[ ] .env is not committed
[ ] Private keys are not committed
[ ] Seed phrases are not committed
[ ] Encryption keys are not committed
[ ] RPC secrets are not committed
[ ] Private keys are not printed in logs
[ ] Decrypted wallet information is not logged
[ ] Private keys are not returned through APIs
[ ] Private keys are not sent to frontend
[ ] Sensitive configuration is protected
```

---

# Development Checklist

Before blockchain testing:

```text
[ ] Node.js installed
[ ] npm installed
[ ] Dependencies installed
[ ] Environment variables configured
[ ] Hardhat configured
[ ] Sepolia RPC configured
[ ] Wallet configured
[ ] Test ETH available
```

---

# Smart Contract Checklist

Before interacting with a contract:

```text
[ ] Contract compiled
[ ] Contract tests passing
[ ] Correct network selected
[ ] Correct contract address configured
[ ] Correct signer configured
[ ] Required wallet balance available
```

---

# Transaction Checklist

Before submitting a transaction:

```text
[ ] DID exists
[ ] DID is verified
[ ] DID-to-wallet mapping exists
[ ] Sender address is valid
[ ] Sender matches DID wallet
[ ] Recipient address is valid
[ ] Amount is valid
[ ] Wallet has sufficient balance
[ ] Correct chain is selected
[ ] RPC connection is working
[ ] Idempotency key is handled
```

---

# Escrow Checklist

Before performing an escrow operation:

```text
[ ] Escrow exists
[ ] Escrow ID is valid
[ ] Contract address is correct
[ ] Escrow is in the expected state
[ ] Wallet has sufficient ETH
[ ] Arbiter address is correct
[ ] Caller has required authorization
```

---

# Engineer Handover

The following procedure should be followed by a new engineer taking over the blockchain component.

---

# Step 1 - Get the Repository

Clone the repository:

```powershell
git clone <repository-url>
```

Enter the project:

```powershell
cd blockchain-architect
```

---

# Step 2 - Install Dependencies

Install the project dependencies:

```powershell
npm install
```

If the backend has its own package configuration:

```powershell
cd api\api
npm install
```

---

# Step 3 - Configure Environment

Create the local environment configuration:

```text
.env
```

Configure the required:

```text
RPC configuration
wallet configuration
encryption configuration
DID administrator configuration
arbiter configuration
```

Never commit `.env`.

---

# Step 4 - Compile Contracts

From the project root:

```powershell
npx hardhat compile
```

Confirm that the contracts compile successfully.

---

# Step 5 - Run Contract Tests

Run:

```powershell
npx hardhat test
```

Confirm that the smart-contract test suite completes successfully.

---

# Step 6 - Start Backend

Run:

```powershell
cd api\api
npm start
```

Confirm:

```text
Transaction API running on port 3000
```

---

# Step 7 - Verify DID

Verify that:

```text
DID exists
DID is verified
DID is mapped to the expected wallet
```

---

# Step 8 - Verify Wallet

Check:

```text
Wallet address
Chain
Wallet status
Wallet balance
DID mapping
```

---

# Step 9 - Test Message Signing

Perform:

```text
Signing Request
      |
      v
Wallet Service
      |
      v
Message Signature
      |
      v
Signature Verification
```

Confirm that the signature corresponds to the expected wallet.

---

# Step 10 - Test Transaction

Create a transaction and verify:

```text
Transaction Created
        |
        v
Transaction Validated
        |
        v
Wallet Verified
        |
        v
Transaction Signed
        |
        v
Blockchain Submitted
        |
        v
Transaction Confirmed
```

---

# Step 11 - Test Idempotency

Send the same transaction request twice using the same idempotency key.

Expected behavior:

```text
Request 1
   |
   v
Transaction Created
```

Then:

```text
Request 2
   |
   v
Existing Transaction Returned
```

No second blockchain transaction should be created.

---

# Step 12 - Test Escrow

Verify the escrow state:

```text
Created
```

Perform deposit:

```text
deposit()
```

Expected:

```text
Created -> Funded
```

Then test release:

```text
Funded -> Released
```

or refund:

```text
Funded -> Refunded
```

---

# Final Architecture Summary

The complete CLXEND blockchain architecture can be understood as:

```text
                         USER
                           |
                           v
                          DID
                           |
                           v
                  DID Verification
                           |
                           v
                   Wallet Mapping
                           |
                           v
                    Wallet Address
                           |
                           v
                   Encrypted Key
                           |
                           v
                    Wallet Service
                           |
                           v
                  Transaction Service
                           |
                           v
                  Blockchain Service
                           |
                           v
                     Ethereum RPC
                           |
                           v
                        Sepolia
                           |
                +----------+----------+
                |                     |
                v                     v
           DID Registry        Escrow Contract
                                      |
                              +-------+-------+
                              |               |
                              v               v
                           Release          Refund
```

---

# Key Concepts

## Identity

```text
DID = User Identity
```

## Blockchain Account

```text
Wallet Address = Blockchain Account
```

## Authorization

```text
Private Key = Transaction Signing Authority
```

## Business Action

```text
Transaction = Blockchain Action
```

## Blockchain Rules

```text
Smart Contract = Enforced Business Rules
```

---

# MVP Limitations

The current implementation is an MVP/development architecture.

Important limitations include:

- File-based idempotency is not suitable for concurrent production requests.
- Environment-based secret configuration should be replaced with dedicated production key management.
- Private-key custody requires stronger infrastructure for production.
- Production deployments should use database-backed atomic operations for transaction and idempotency handling.
- Production key-management should use KMS, HSM, secure secret management, or equivalent custody infrastructure.

---

# Production Recommendations

Before production deployment:

```text
[ ] Move private-key custody to KMS/HSM
[ ] Move secrets to secure secret manager
[ ] Use production database
[ ] Add unique idempotency constraint
[ ] Add atomic transaction handling
[ ] Add audit logging
[ ] Add key rotation
[ ] Add role-based access control
[ ] Protect arbiter key
[ ] Protect DID administrator key
[ ] Implement monitoring
[ ] Implement alerting
[ ] Review smart-contract security
[ ] Review backend security
[ ] Review API authentication and authorization
```

---

# Final Handover Summary

The CLXEND MVP implements a backend-managed Ethereum wallet architecture.

The complete relationship is:

```text
DID
 |
 | identifies
 v
USER
 |
 | mapped to
 v
WALLET ADDRESS
 |
 | controlled by
 v
PRIVATE KEY
 |
 | signs
 v
TRANSACTION
 |
 | submitted to
 v
ETHEREUM / SEPOLIA
 |
 +----------------------+
 |                      |
 v                      v
NORMAL TRANSACTION    ESCROW CONTRACT
                          |
                    +-----+-----+
                    |           |
                    v           v
                 RELEASE      REFUND
```

The wallet service manages wallet creation, wallet mapping, private-key encryption, and signing.

The DID service manages identity and verification.

The transaction service manages transaction validation, transaction records, transaction status, and idempotency.

The blockchain service communicates with Ethereum.

The escrow service interacts with the escrow smart contract.

The smart contract enforces escrow business rules.

The current architecture is suitable for development and MVP testing, while production deployment requires stronger key custody, database-backed concurrency controls, and additional security infrastructure.

---

# Quick Command Reference

## Install

```powershell
npm install
```

## Start Backend

```powershell
cd api\api
npm start
```

## Compile Contracts

```powershell
npx hardhat compile
```

## Run Tests

```powershell
npx hardhat test
```

## Run Sepolia Script

```powershell
npx hardhat run .\scripts\<script>.js --network sepolia
```

---

# Final Checklist

```text
[ ] Repository cloned
[ ] Dependencies installed
[ ] .env configured
[ ] .env excluded from Git
[ ] Contracts compiled
[ ] Contract tests executed
[ ] Backend started
[ ] DID verified
[ ] Wallet mapped
[ ] Wallet balance checked
[ ] Message signing tested
[ ] Signature verification tested
[ ] Transaction creation tested
[ ] Transaction signing tested
[ ] Blockchain submission tested
[ ] Transaction confirmation tested
[ ] Transaction failure tested
[ ] Idempotency tested
[ ] Escrow deposit tested
[ ] Escrow release tested
[ ] Escrow refund tested
[ ] Security checks completed
[ ] Handover completed
```

---

# End of Blockchain Integration Guide

**Project:** CLXEND Blockchain Platform

**Sprint:** Sprint 5

**Network:** Ethereum Sepolia Testnet

**Chain ID:** `11155111`

**Documentation Type:** Blockchain Integration / Technical Handover