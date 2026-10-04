const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DIDRegistry", function () {

    let didRegistry;
    let admin;
    let user1;
    let user2;

    beforeEach(async function () {

        // Get test accounts
        [admin, user1, user2] = await ethers.getSigners();

        // Deploy DIDRegistry contract
        const DIDRegistry = await ethers.getContractFactory(
            "DIDRegistry"
        );

        didRegistry = await DIDRegistry.deploy();

        await didRegistry.waitForDeployment();
    });


    // =========================================================
    // Test 1 - Create Identity
    // =========================================================

    it("Should create a new identity", async function () {

        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        const identity =
            await didRegistry.identities(user1.address);

        expect(identity.did_id)
            .to.equal("did:ethr:user1");

        expect(identity.wallet)
            .to.equal(user1.address);

        expect(identity.kyc_hash)
            .to.equal("QmHash123");

        // PENDING = 0
        expect(identity.status)
            .to.equal(0);

    });


    // =========================================================
    // Test 2 - Prevent Duplicate Identity
    // =========================================================

    it("Should prevent duplicate identities", async function () {

        // Create first identity
        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        // Try to create another identity for same wallet
        await expect(
            didRegistry
                .connect(user1)
                .createIdentity(
                    "did:new",
                    "hash"
                )
        )
        .to.be.revertedWithCustomError(
            didRegistry,
            "IdentityAlreadyExists"
        );

    });


    // =========================================================
    // Test 3 - Get Identity
    // =========================================================

    it("Should return identity information", async function () {

        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        const identity =
            await didRegistry.getIdentity(user1.address);

        expect(identity[0])
            .to.equal("did:ethr:user1");

        expect(identity[1])
            .to.equal(user1.address);

        expect(identity[2])
            .to.equal("QmHash123");

        // PENDING = 0
        expect(identity[3])
            .to.equal(0);

    });


    // =========================================================
    // Test 4 - Admin Updates Status
    // =========================================================

    it("Admin should update identity status", async function () {

        // User creates identity
        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        // Admin changes status to VERIFIED
        // PENDING = 0
        // VERIFIED = 1
        await didRegistry.updateStatus(
            user1.address,
            1
        );

        const identity =
            await didRegistry.identities(user1.address);

        expect(identity.status)
            .to.equal(1);

    });


    // =========================================================
    // Test 5 - Reject Non-Admin Status Update
    // =========================================================

    it("Should reject non-admin status updates", async function () {

        // User creates identity
        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        // user2 is NOT the admin
        await expect(
            didRegistry
                .connect(user2)
                .updateStatus(
                    user1.address,
                    1
                )
        )
        .to.be.revertedWithCustomError(
            didRegistry,
            "NotAuthorized"
        );

    });


    // =========================================================
    // Test 6 - Identity Not Found
    // =========================================================

    it("Should revert when identity does not exist", async function () {

        await expect(
            didRegistry.getIdentity(user2.address)
        )
        .to.be.revertedWithCustomError(
            didRegistry,
            "IdentityNotFound"
        );

    });


    // =========================================================
    // Test 7 - Get Status
    // =========================================================

    it("Should return PENDING status", async function () {

        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        const status =
            await didRegistry.getStatus(user1.address);

        expect(status)
            .to.equal("PENDING");

    });


    // =========================================================
    // Test 8 - Get VERIFIED Status
    // =========================================================

    it("Should return VERIFIED status", async function () {

        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        await didRegistry.updateStatus(
            user1.address,
            1
        );

        const status =
            await didRegistry.getStatus(user1.address);

        expect(status)
            .to.equal("VERIFIED");

    });


    // =========================================================
    // Test 9 - Get REJECTED Status
    // =========================================================

    it("Should return REJECTED status", async function () {

        await didRegistry
            .connect(user1)
            .createIdentity(
                "did:ethr:user1",
                "QmHash123"
            );

        await didRegistry.updateStatus(
            user1.address,
            2
        );

        const status =
            await didRegistry.getStatus(user1.address);

        expect(status)
            .to.equal("REJECTED");

    });


    // =========================================================
    // Test 10 - Get Status for Missing Identity
    // =========================================================

    it("Should reject status lookup for missing identity", async function () {

        await expect(
            didRegistry.getStatus(user2.address)
        )
        .to.be.revertedWithCustomError(
            didRegistry,
            "IdentityNotFound"
        );

    });

});