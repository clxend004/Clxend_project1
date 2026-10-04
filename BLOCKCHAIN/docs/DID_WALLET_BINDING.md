DID-Wallet Binding Documentation
1. Purpose

This document describes the implementation and validation of the DID-to-wallet binding mechanism developed as part of Sprint 2.

The objective is to establish a deterministic relationship between a blockchain wallet address and a Decentralized Identifier (DID).

The DID Registry stores the DID, wallet address, KYC hash reference, identity status, and creation timestamp on-chain.

Sensitive KYC information is kept off-chain, while its hash/reference is stored on-chain.

2. DID-Wallet Mapping

The DID Registry uses the wallet address as the mapping key.

mapping(address => Identity) public identities;

The identity structure contains:

struct Identity {
    string did_id;
    address wallet;
    string kyc_hash;
    Status status;
    uint256 created_at;
}

The mapping can be represented as:

Wallet Address
      |
      v
DID Registry
      |
      v
Identity
      |
      +---- DID
      |
      +---- Wallet
      |
      +---- KYC Hash
      |
      +---- Status
      |
      +---- Created Timestamp
3. On-Chain and Off-Chain Boundary

The following information is stored on-chain:

Field	Description
did_id	Decentralized Identifier
wallet	Blockchain wallet address
kyc_hash	Hash/reference of KYC information
status	Current identity verification status
created_at	Identity creation timestamp

Sensitive information is not stored directly on the blockchain.

Examples of off-chain information include:

Name
Date of Birth
Government identification
Address
KYC documents
Personal documents

The flow is:

Off-chain KYC Information
          |
          v
     Generate Hash
          |
          v
     KYC Hash
          |
          v
     Store On-chain

This allows the blockchain to maintain a reference to the KYC information without storing the sensitive information directly.

4. DID Creation

A wallet can create an identity using the createIdentity() function.

function createIdentity(
    string memory _did,
    string memory _kycHash
)

The wallet sending the transaction becomes the wallet associated with the DID:

wallet: msg.sender

The creation flow is:

User Wallet
     |
     v
Submit DID + KYC Hash
     |
     v
createIdentity()
     |
     v
DID-Wallet Mapping Created
     |
     v
IdentityCreated Event

A newly created identity is assigned the initial status:

PENDING
5. DID Lookup

The DID Registry provides an identity lookup function:

function getIdentity(address user)

The wallet address is used to retrieve the corresponding identity.

Wallet Address
      |
      v
getIdentity(wallet)
      |
      v
DID Registry
      |
      v
Identity Information

The lookup returns:

DID
Wallet address
KYC hash
Status
Creation timestamp

Example:

Wallet:
0x01a119788F69A727529D3d4b2c9e0A71B5e822ef


DID:
did:004


KYC Hash:
QmFinalHash


Status:
PENDING
6. Identity Status

The DID Registry supports three identity statuses:

enum Status {
    PENDING,
    VERIFIED,
    REJECTED
}

The lifecycle is:

             PENDING
                |
          +-----+-----+
          |           |
          v           v
      VERIFIED     REJECTED

A newly created identity starts in the PENDING state.

Only the administrator can update the identity status.

7. Authorization

Identity status updates are restricted to the administrator.

if (msg.sender != admin) {
    revert NotAuthorized();
}

This prevents unauthorized wallets from changing the verification status of another user's identity.

The authorization behavior is covered by unit testing.

8. Duplicate Identity Prevention

A wallet is allowed to create only one identity.

Before creating an identity, the contract checks whether the wallet already has a DID:

if (bytes(identities[msg.sender].did_id).length != 0) {
    revert IdentityAlreadyExists();
}

Expected behavior:

Wallet A
   |
   +---- DID-001 ✅
   |
   +---- DID-002 ❌

This ensures that the wallet-to-DID relationship remains deterministic.

9. Invalid Identity Lookup

If a wallet does not have an identity, the lookup operation is rejected.

revert IdentityNotFound();

The flow is:

Unknown Wallet
      |
      v
getIdentity(wallet)
      |
      v
IdentityNotFound

This prevents the application from treating an unregistered wallet as a valid identity.

10. Validation Scenarios

The DID-Wallet binding implementation was validated using automated Hardhat unit tests.

DID Registry
Create a valid identity
Prevent duplicate identity creation
Return identity information
Allow admin status update
Reject non-admin status update
Reject lookup of a non-existent identity
Return PENDING status
Return VERIFIED status
Return REJECTED status
Reject status lookup for a non-existent identity
11. Test Evidence

The unit tests are implemented in:

test/DIDRegistry.test.js

The smart contract is:

contracts/DIDRegistry.sol

The identity creation script is:

scripts/createIdentity.js

The identity lookup script is:

scripts/lookupIdentity.js

The test suite can be executed using:

npx hardhat test
12. Testnet Lookup Evidence

The DID identity was successfully deployed and queried on the Sepolia test network.

Example:

Using contract:
0x95f69995322c2c932E7E690354EF4Ef9fFf27D42


Looking up address:
0x01a119788F69a727529D3d4b2c9e0A71B5e822ef


Identity Lookup Result:


DID:
did:004


Wallet:
0x01a119788F69a727529D3d4b2c9e0A71B5e822ef


KYC Hash:
QmFinalHash


Status:
PENDING

This demonstrates that the wallet address can be used to retrieve the corresponding DID identity from the deployed registry.

13. Evidence to Submit

The following evidence can be submitted for the DID-Wallet Binding task:

Evidence	File / Output
Smart contract	contracts/DIDRegistry.sol
Unit tests	test/DIDRegistry.test.js
Identity creation	scripts/createIdentity.js
Identity lookup	scripts/lookupIdentity.js
Test execution	npx hardhat test
Testnet evidence	Identity lookup output
Documentation	DID_WALLET_BINDING.md
14. Acceptance Criteria
Requirement	Status
DID-to-wallet mapping defined	Resolved
Wallet linked with DID	Resolved
On-chain/off-chain boundary documented	Resolved
KYC hash stored instead of sensitive data	Resolved
Identity lookup implemented	Resolved
Duplicate identity prevented	Resolved
Missing identity handled	Resolved
Admin authorization implemented	Resolved
Status lookup implemented	Resolved
Unit tests implemented	Resolved
Testnet lookup demonstrated	Resolved
15. Final Status

The DID-Wallet Binding implementation establishes a deterministic relationship between a blockchain wallet and a Decentralized Identifier.

The wallet address is used as the lookup key in the DID Registry. The registry stores the DID, wallet address, KYC hash reference, verification status, and creation timestamp.

Sensitive KYC information remains outside the blockchain, while its hash/reference is maintained on-chain.

The implementation includes identity creation, wallet-to-DID lookup, duplicate prevention, authorization, status management, and failure handling.

The functionality is covered by automated unit tests and has been demonstrated using the deployed testnet contract.

Final Status: COMPLETED