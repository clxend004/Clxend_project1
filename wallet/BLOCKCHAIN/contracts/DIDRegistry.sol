// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DID Registry
/// @author Durai Prakash
/// @notice Stores decentralized identity records and their KYC hash references.
contract DIDRegistry {

    // =============================================================
    //                         CUSTOM ERRORS
    // =============================================================

    /// @notice Thrown when a wallet already has an identity.
    error IdentityAlreadyExists();

    /// @notice Thrown when the caller is not the contract administrator.
    error NotAuthorized();

    /// @notice Thrown when an identity cannot be found for a wallet.
    error IdentityNotFound();


    // =============================================================
    //                         STATE VARIABLES
    // =============================================================

    /// @notice Address of the administrator authorized to update identity status.
    address public admin;


    // =============================================================
    //                            ENUMS
    // =============================================================

    /// @notice Represents the verification status of an identity.
    enum Status {
        PENDING,
        VERIFIED,
        REJECTED
    }


    // =============================================================
    //                           STRUCTURES
    // =============================================================

    /// @notice Stores identity information associated with a wallet.
    struct Identity {
        string did_id;
        address wallet;
        string kyc_hash;
        Status status;
        uint256 created_at;
    }


    // =============================================================
    //                            STORAGE
    // =============================================================

    /// @notice Maps a wallet address to its DID identity record.
    mapping(address => Identity) public identities;


    // =============================================================
    //                            EVENTS
    // =============================================================

    /// @notice Emitted when a new DID identity is created.
    /// @param user Wallet address associated with the identity.
    /// @param did DID identifier assigned to the wallet.
    event IdentityCreated(
        address indexed user,
        string did
    );

    /// @notice Emitted when an identity's verification status changes.
    /// @param user Wallet address associated with the identity.
    /// @param status New verification status.
    event StatusUpdated(
        address indexed user,
        Status status
    );


    // =============================================================
    //                         CONSTRUCTOR
    // =============================================================

    /// @notice Creates the DID registry and assigns the deployer as admin.
    constructor() {
        admin = msg.sender;
    }


    // =============================================================
    //                      CREATE IDENTITY
    // =============================================================

    /// @notice Creates a new DID identity for the caller's wallet.
    /// @dev The wallet can create only one identity.
    /// @param _did DID identifier associated with the wallet.
    /// @param _kycHash Hash reference for the user's KYC information.
    function createIdentity(
        string memory _did,
        string memory _kycHash
    )
        public
    {
        if (bytes(identities[msg.sender].did_id).length != 0) {
            revert IdentityAlreadyExists();
        }

        identities[msg.sender] = Identity({
            did_id: _did,
            wallet: msg.sender,
            kyc_hash: _kycHash,
            status: Status.PENDING,
            created_at: block.timestamp
        });

        emit IdentityCreated(msg.sender, _did);
    }


    // =============================================================
    //                       UPDATE STATUS
    // =============================================================

    /// @notice Updates the verification status of an existing identity.
    /// @dev Only the registry administrator can update identity status.
    /// @param user Wallet address whose identity status will be updated.
    /// @param _status New verification status.
    function updateStatus(
        address user,
        Status _status
    )
        public
    {
        if (msg.sender != admin) {
            revert NotAuthorized();
        }

        if (identities[user].wallet == address(0)) {
            revert IdentityNotFound();
        }

        identities[user].status = _status;

        emit StatusUpdated(user, _status);
    }


    // =============================================================
    //                         GET IDENTITY
    // =============================================================

    /// @notice Returns the complete identity information for a wallet.
    /// @param user Wallet address whose identity should be retrieved.
    /// @return didId DID identifier.
    /// @return wallet Wallet address associated with the DID.
    /// @return kycHash Hash reference for KYC information.
    /// @return status Current identity verification status.
    /// @return createdAt Blockchain timestamp when the identity was created.
    function getIdentity(address user)
        public
        view
        returns (
            string memory didId,
            address wallet,
            string memory kycHash,
            Status status,
            uint256 createdAt
        )
    {
        if (bytes(identities[user].did_id).length == 0) {
            revert IdentityNotFound();
        }

        Identity memory id = identities[user];

        return (
            id.did_id,
            id.wallet,
            id.kyc_hash,
            id.status,
            id.created_at
        );
    }


    // =============================================================
    //                         GET STATUS
    // =============================================================

    /// @notice Returns the verification status of an identity as text.
    /// @param user Wallet address whose status should be retrieved.
    /// @return status Current status as PENDING, VERIFIED, or REJECTED.
    function getStatus(address user)
        public
        view
        returns (string memory status)
    {
        if (bytes(identities[user].did_id).length == 0) {
            revert IdentityNotFound();
        }

        if (identities[user].status == Status.PENDING) {
            return "PENDING";
        }

        if (identities[user].status == Status.VERIFIED) {
            return "VERIFIED";
        }

        return "REJECTED";
    }
}