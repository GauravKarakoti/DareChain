const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy DareXModular
  console.log("Deploying DareXModular...");
  const DareXModular = await ethers.getContractFactory("DareXModular");
  const dareXModular = await DareXModular.deploy(
    deployer.address // Treasury address
  );
  await dareXModular.waitForDeployment();
  const dareXModularAddress = await dareXModular.getAddress();
  console.log("DareXModular deployed to:", dareXModularAddress);

  // Get the deployed RewardDistribution contract address from DareXModular
  const rewardDistributionAddress = await dareXModular.rewardDistribution();
  console.log("RewardDistribution contract is at:", rewardDistributionAddress);

  console.log("\nDeployment completed successfully! ✅");
  console.log("------------------------------------");
  console.log("DareXModular address:", dareXModularAddress);
  console.log("RewardDistribution address:", rewardDistributionAddress);
  console.log("------------------------------------");

  // Save deployment addresses to a file for frontend integration
  const addresses = {
    dareXModular: dareXModularAddress,
    rewardDistribution: rewardDistributionAddress
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