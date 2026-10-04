const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowAdvanced", function () {

    let escrow;
    let buyer;
    let seller;
    let arbiter;
    let user;

    const depositAmount = ethers.parseEther("1");

    beforeEach(async function () {

        [buyer, seller, arbiter, user] =
            await ethers.getSigners();

        const Escrow =
            await ethers.getContractFactory(
                "EscrowAdvanced",
                buyer
            );

        escrow = await Escrow.deploy(
            seller.address,
            arbiter.address
        );

        await escrow.waitForDeployment();
    });


    // =====================================================
    // DEPLOYMENT
    // =====================================================

    describe("Deployment", function () {

        it("Should set the correct buyer", async function () {

            expect(await escrow.buyer())
                .to.equal(buyer.address);

        });


        it("Should set the correct seller", async function () {

            expect(await escrow.seller())
                .to.equal(seller.address);

        });


        it("Should set the correct arbiter", async function () {

            expect(await escrow.arbiter())
                .to.equal(arbiter.address);

        });


        it("Should start in Created state", async function () {

            expect(await escrow.getCurrentState())
                .to.equal("Created");

        });


        it("Should start with zero balance", async function () {

            expect(await escrow.getBalance())
                .to.equal(0);

        });

    });


    // =====================================================
    // DEPOSIT
    // =====================================================

    describe("Deposit", function () {

        it("Should allow buyer to deposit ETH", async function () {

            await expect(
                escrow.connect(buyer).deposit({
                    value: depositAmount
                })
            )
                .to.emit(escrow, "Deposited")
                .withArgs(
                    buyer.address,
                    depositAmount
                );

            expect(await escrow.getBalance())
                .to.equal(depositAmount);

            expect(await escrow.getCurrentState())
                .to.equal("Funded");

        });


        it("Should reject zero ETH deposit", async function () {

            await expect(
                escrow.connect(buyer).deposit({
                    value: 0
                })
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "MustSendETH"
                );

        });


        it("Should reject a second deposit", async function () {

            await escrow.connect(buyer).deposit({
                value: depositAmount
            });

            await expect(
                escrow.connect(buyer).deposit({
                    value: depositAmount
                })
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "InvalidTransactionState"
                );

        });

    });


    // =====================================================
    // RELEASE
    // =====================================================

    describe("Release", function () {

        beforeEach(async function () {

            await escrow.connect(buyer).deposit({
                value: depositAmount
            });

        });


        it("Should allow arbiter to release funds", async function () {

            await expect(
                escrow.connect(arbiter).release()
            )
                .to.emit(escrow, "Released")
                .withArgs(
                    seller.address,
                    depositAmount
                );

            expect(await escrow.getCurrentState())
                .to.equal("Released");

            expect(await escrow.getBalance())
                .to.equal(0);

        });


        it("Should reject release from non-arbiter", async function () {

            await expect(
                escrow.connect(user).release()
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "OnlyArbiterAllowed"
                );

        });


        it("Should reject release twice", async function () {

            await escrow.connect(arbiter).release();

            await expect(
                escrow.connect(arbiter).release()
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "InvalidTransactionState"
                );

        });

    });


    // =====================================================
    // REFUND
    // =====================================================

    describe("Refund", function () {

        beforeEach(async function () {

            await escrow.connect(buyer).deposit({
                value: depositAmount
            });

        });


        it("Should allow arbiter to refund buyer", async function () {

            await expect(
                escrow.connect(arbiter).refund()
            )
                .to.emit(escrow, "Refunded")
                .withArgs(
                    buyer.address,
                    depositAmount
                );

            expect(await escrow.getCurrentState())
                .to.equal("Refunded");

            expect(await escrow.getBalance())
                .to.equal(0);

        });


        it("Should reject refund from non-arbiter", async function () {

            await expect(
                escrow.connect(user).refund()
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "OnlyArbiterAllowed"
                );

        });


        it("Should reject refund twice", async function () {

            await escrow.connect(arbiter).refund();

            await expect(
                escrow.connect(arbiter).refund()
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "InvalidTransactionState"
                );

        });


        it("Should reject refund after release", async function () {

            await escrow.connect(arbiter).release();

            await expect(
                escrow.connect(arbiter).refund()
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "InvalidTransactionState"
                );

        });


        it("Should reject release after refund", async function () {

            await escrow.connect(arbiter).refund();

            await expect(
                escrow.connect(arbiter).release()
            )
                .to.be.revertedWithCustomError(
                    escrow,
                    "InvalidTransactionState"
                );

        });

    });


    // =====================================================
    // TRANSACTION LIFECYCLE
    // =====================================================

    describe("Transaction Lifecycle", function () {

        it(
            "Should follow Created -> Funded -> Released",
            async function () {

                // Initial state
                expect(
                    await escrow.getCurrentState()
                ).to.equal("Created");

                // Buyer deposits
                await escrow.connect(buyer).deposit({
                    value: depositAmount
                });

                // State should become Funded
                expect(
                    await escrow.getCurrentState()
                ).to.equal("Funded");

                // Arbiter releases
                await escrow.connect(arbiter).release();

                // State should become Released
                expect(
                    await escrow.getCurrentState()
                ).to.equal("Released");

            }
        );


        it(
            "Should follow Created -> Funded -> Refunded",
            async function () {

                // Initial state
                expect(
                    await escrow.getCurrentState()
                ).to.equal("Created");

                // Buyer deposits
                await escrow.connect(buyer).deposit({
                    value: depositAmount
                });

                // State should become Funded
                expect(
                    await escrow.getCurrentState()
                ).to.equal("Funded");

                // Arbiter refunds
                await escrow.connect(arbiter).refund();

                // State should become Refunded
                expect(
                    await escrow.getCurrentState()
                ).to.equal("Refunded");

            }
        );

    });

});