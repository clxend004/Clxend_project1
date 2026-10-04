const { ethers } = require("hardhat");

describe("Escrow Gas Usage", function () {
  let escrow, buyer, seller, arbiter;

  beforeEach(async function () {
    [buyer, seller, arbiter] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("EscrowAdvanced", buyer);
    escrow = await Escrow.deploy(seller.address, arbiter.address);
    await escrow.waitForDeployment();
  });

  it("Deposit transaction", async function () {
    const tx = await escrow.deposit({ value: ethers.parseEther("1") });
    await tx.wait();
  });

  it("Release transaction", async function () {
    await escrow.deposit({ value: ethers.parseEther("1") });
    const tx = await escrow.connect(arbiter).release();
    await tx.wait();
  });
});