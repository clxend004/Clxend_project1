const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowAdvanced - Security Tests", function () {

    let escrow;
    let buyer;
    let seller;
    let arbiter;
    let attacker;

    beforeEach(async function () {

        [buyer, seller, arbiter, attacker] =
            await ethers.getSigners();

        const Escrow =
            await ethers.getContractFactory(
                "EscrowAdvanced"
            );

        escrow = await Escrow.deploy(
            seller.address,
            arbiter.address
        );

        await escrow.waitForDeployment();

        // Buyer funds the escrow
        await escrow.connect(buyer).deposit({
            value: ethers.parseEther("0.01")
        });
    });


    // =========================================================
    // TEST 1: Unauthorized Release
    // =========================================================

    it("Should reject release by non-arbiter", async function () {

        await expect(
            escrow.connect(attacker).release()
        ).to.be.revertedWithCustomError(
            escrow,
            "OnlyArbiterAllowed"
        );

        expect(
            await escrow.getCurrentState()
        ).to.equal("Funded");

        expect(
            await escrow.getBalance()
        ).to.equal(
            ethers.parseEther("0.01")
        );
    });


    // =========================================================
    // TEST 2: Authorized Release
    // =========================================================

    it("Should allow release by arbiter", async function () {

        await escrow.connect(arbiter).release();

        expect(
            await escrow.getCurrentState()
        ).to.equal("Released");

        expect(
            await escrow.getBalance()
        ).to.equal(0);
    });


    // =========================================================
    // TEST 3: Unauthorized Refund
    // =========================================================

    it("Should reject refund by non-arbiter", async function () {

        await expect(
            escrow.connect(attacker).refund()
        ).to.be.revertedWithCustomError(
            escrow,
            "OnlyArbiterAllowed"
        );

        expect(
            await escrow.getCurrentState()
        ).to.equal("Funded");

        expect(
            await escrow.getBalance()
        ).to.equal(
            ethers.parseEther("0.01")
        );
    });


    // =========================================================
    // TEST 4: Authorized Refund
    // =========================================================

    it("Should allow refund by arbiter", async function () {

        await escrow.connect(arbiter).refund();

        expect(
            await escrow.getCurrentState()
        ).to.equal("Refunded");

        expect(
            await escrow.getBalance()
        ).to.equal(0);
    });


    // =========================================================
    // TEST 5: Release Before Funding
    // =========================================================

    it("Should reject release before funding", async function () {

        const Escrow =
            await ethers.getContractFactory(
                "EscrowAdvanced"
            );

        const freshEscrow =
            await Escrow.deploy(
                seller.address,
                arbiter.address
            );

        await freshEscrow.waitForDeployment();

        // Escrow should initially be Created
        expect(
            await freshEscrow.getCurrentState()
        ).to.equal("Created");

        // Arbiter tries to release before funding
        await expect(
            freshEscrow
                .connect(arbiter)
                .release()
        ).to.be.revertedWithCustomError(
            freshEscrow,
            "InvalidTransactionState"
        );

        // State must remain Created
        expect(
            await freshEscrow.getCurrentState()
        ).to.equal("Created");

        // Balance must remain zero
        expect(
            await freshEscrow.getBalance()
        ).to.equal(0);
    });


    // =========================================================
    // TEST 6: Refund Before Funding
    // =========================================================

    it("Should reject refund before funding", async function () {

        const Escrow =
            await ethers.getContractFactory(
                "EscrowAdvanced"
            );

        const freshEscrow =
            await Escrow.deploy(
                seller.address,
                arbiter.address
            );

        await freshEscrow.waitForDeployment();

        // Escrow should initially be Created
        expect(
            await freshEscrow.getCurrentState()
        ).to.equal("Created");

        // Arbiter tries to refund before funding
        await expect(
            freshEscrow
                .connect(arbiter)
                .refund()
        ).to.be.revertedWithCustomError(
            freshEscrow,
            "InvalidTransactionState"
        );

        // State must remain Created
        expect(
            await freshEscrow.getCurrentState()
        ).to.equal("Created");

        // Balance must remain zero
        expect(
            await freshEscrow.getBalance()
        ).to.equal(0);
    });


    // =========================================================
    // TEST 7: Refund After Release
    // =========================================================

    it("Should reject refund after release", async function () {

        // First release the escrow
        await escrow
            .connect(arbiter)
            .release();

        // Verify Released state
        expect(
            await escrow.getCurrentState()
        ).to.equal("Released");

        // Try to refund after release
        await expect(
            escrow
                .connect(arbiter)
                .refund()
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );

        // State must remain Released
        expect(
            await escrow.getCurrentState()
        ).to.equal("Released");

        // Balance must remain zero
        expect(
            await escrow.getBalance()
        ).to.equal(0);
    });


    // =========================================================
    // TEST 8: Release After Refund
    // =========================================================

    it("Should reject release after refund", async function () {

        // First refund the escrow
        await escrow
            .connect(arbiter)
            .refund();

        // Verify Refunded state
        expect(
            await escrow.getCurrentState()
        ).to.equal("Refunded");

        // Try to release after refund
        await expect(
            escrow
                .connect(arbiter)
                .release()
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );

        // State must remain Refunded
        expect(
            await escrow.getCurrentState()
        ).to.equal("Refunded");

        // Balance must remain zero
        expect(
            await escrow.getBalance()
        ).to.equal(0);
    });


    // =========================================================
    // TEST 9: Duplicate Deposit
    // =========================================================

    it("Should reject duplicate deposit", async function () {

        // The beforeEach() already made the first deposit.
        expect(
            await escrow.getCurrentState()
        ).to.equal("Funded");

        expect(
            await escrow.getBalance()
        ).to.equal(
            ethers.parseEther("0.01")
        );

        // Try to deposit again
        await expect(
            escrow.connect(buyer).deposit({
                value: ethers.parseEther("0.01")
            })
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );

        // State must remain Funded
        expect(
            await escrow.getCurrentState()
        ).to.equal("Funded");

        // Balance must remain 0.01 ETH
        expect(
            await escrow.getBalance()
        ).to.equal(
            ethers.parseEther("0.01")
        );
    });


    // =========================================================
    // TEST 10: Zero Value Deposit
    // =========================================================

    it("Should reject zero ETH deposit", async function () {

        // Create a fresh escrow in Created state
        const Escrow =
            await ethers.getContractFactory(
                "EscrowAdvanced"
            );

        const freshEscrow =
            await Escrow.deploy(
                seller.address,
                arbiter.address
            );

        await freshEscrow.waitForDeployment();

        // Verify initial state
        expect(
            await freshEscrow.getCurrentState()
        ).to.equal("Created");

        // Try to deposit zero ETH
        await expect(
            freshEscrow
                .connect(buyer)
                .deposit({
                    value: 0
                })
        ).to.be.revertedWithCustomError(
            freshEscrow,
            "MustSendETH"
        );

        // State must remain Created
        expect(
            await freshEscrow.getCurrentState()
        ).to.equal("Created");

        // Balance must remain zero
        expect(
            await freshEscrow.getBalance()
        ).to.equal(0);
    });

});