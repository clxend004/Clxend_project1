const hre = require("hardhat");

async function main() {

  // ✅ Change to DIDRegistry
  const DIDRegistry = await hre.ethers.getContractFactory("DIDRegistry");

  console.log("Deploying DIDRegistry contract...");

  // ✅ No constructor arguments needed
  const contract = await DIDRegistry.deploy();

  const deployTx = contract.deploymentTransaction();
  const receipt = await deployTx.wait();

  console.log("✅ DIDRegistry deployed to:", await contract.getAddress());
  console.log("Gas Used:", receipt.gasUsed.toString());
  console.log("Gas Price:", deployTx.gasPrice.toString());

  const totalCost = receipt.gasUsed * deployTx.gasPrice;
  console.log("Total ETH Spent:", hre.ethers.formatEther(totalCost));

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});