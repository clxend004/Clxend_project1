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
            await ethers.getContractFactory("EscrowAdvanced");

        escrow = await Escrow.deploy(
            seller.address,
            arbiter.address
        );

        await escrow.waitForDeployment();
    });


    it("should reject release by non-arbiter", async function () {

        await escrow.deposit({
            value: ethers.parseEther("0.01")
        });

        await expect(
            escrow.connect(attacker).release()
        ).to.be.revertedWithCustomError(
            escrow,
            "OnlyArbiterAllowed"
        );
    });


    it("should reject refund by non-arbiter", async function () {

        await escrow.deposit({
            value: ethers.parseEther("0.01")
        });

        await expect(
            escrow.connect(attacker).refund()
        ).to.be.revertedWithCustomError(
            escrow,
            "OnlyArbiterAllowed"
        );
    });


    it("should reject release before deposit", async function () {

        await expect(
            escrow.connect(arbiter).release()
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );
    });


    it("should reject refund before deposit", async function () {

        await expect(
            escrow.connect(arbiter).refund()
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );
    });


    it("should reject zero ETH deposit", async function () {

        await expect(
            escrow.deposit({
                value: 0
            })
        ).to.be.revertedWithCustomError(
            escrow,
            "MustSendETH"
        );
    });


    it("should reject refund after release", async function () {

        await escrow.deposit({
            value: ethers.parseEther("0.01")
        });

        await escrow.connect(arbiter).release();

        await expect(
            escrow.connect(arbiter).refund()
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );
    });


    it("should reject release after refund", async function () {

        await escrow.deposit({
            value: ethers.parseEther("0.01")
        });

        await escrow.connect(arbiter).refund();

        await expect(
            escrow.connect(arbiter).release()
        ).to.be.revertedWithCustomError(
            escrow,
            "InvalidTransactionState"
        );
    });

});