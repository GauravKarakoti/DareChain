const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy mock contracts for testing
  console.log("Deploying MockPYUSD...");
  const MockPYUSD = await ethers.getContractFactory("MockPYUSD");
  const pyusd = await MockPYUSD.deploy();
  await pyusd.waitForDeployment();
  const pyusdAddress = await pyusd.getAddress();
  console.log("MockPYUSD deployed to:", pyusdAddress);

  console.log("Deploying MockSelfProtocol...");
  const MockSelfProtocol = await ethers.getContractFactory("MockSelfProtocol");
  const selfProtocol = await MockSelfProtocol.deploy();
  await selfProtocol.waitForDeployment();
  const selfProtocolAddress = await selfProtocol.getAddress();
  console.log("MockSelfProtocol deployed to:", selfProtocolAddress);

  // Deploy DareXModular
  console.log("Deploying DareXModular...");
  const DareXModular = await ethers.getContractFactory("DareXModular");
  const dareXModular = await DareXModular.deploy(
    pyusdAddress,
    selfProtocolAddress,
    deployer.address // Treasury address
  );
  await dareXModular.waitForDeployment();
  const dareXModularAddress = await dareXModular.getAddress();
  console.log("DareXModular deployed to:", dareXModularAddress);

  // Get the deployed RewardDistribution contract address from DareXModular
  const rewardDistributionAddress = await dareXModular.rewardDistribution();
  console.log("RewardDistribution contract is at:", rewardDistributionAddress);

  // Setup verification for the deployer
  console.log("Setting up identity verification for deployer...");
  await selfProtocol.setVerified(deployer.address, true);
  
  // Mint some PYUSD to deployer for testing
  console.log("Minting test PYUSD...");
  await pyusd.mint(deployer.address, ethers.parseEther("10000"));
  
  // Approve the RewardDistribution contract to spend PYUSD on behalf of the deployer
  console.log(`Approving RewardDistribution contract (${rewardDistributionAddress}) to spend PYUSD...`);
  await pyusd.approve(rewardDistributionAddress, ethers.parseEther("10000"));

  console.log("\nDeployment completed successfully! ✅");
  console.log("------------------------------------");
  console.log("DareXModular address:", dareXModularAddress);
  console.log("RewardDistribution address:", rewardDistributionAddress);
  console.log("MockPYUSD address:", pyusdAddress);
  console.log("MockSelfProtocol address:", selfProtocolAddress);
  console.log("------------------------------------");

  // Save deployment addresses to a file for frontend integration
  const addresses = {
    dareXModular: dareXModularAddress,
    rewardDistribution: rewardDistributionAddress,
    pyusd: pyusdAddress,
    selfProtocol: selfProtocolAddress
  };

  const deploymentPath = path.join(__dirname, '..', 'config/deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(addresses, null, 2));
  console.log(`Deployment info saved to: ${deploymentPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });