const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy mock contracts for testing
  console.log("Deploying MockPYUSD...");
  const MockPYUSD = await ethers.getContractFactory("MockPYUSD");
  const pyusd = await MockPYUSD.deploy();
  await pyusd.waitForDeployment();
  console.log("MockPYUSD deployed to:", await pyusd.getAddress());

  console.log("Deploying MockSelfProtocol...");
  const MockSelfProtocol = await ethers.getContractFactory("MockSelfProtocol");
  const selfProtocol = await MockSelfProtocol.deploy();
  await selfProtocol.waitForDeployment();
  console.log("MockSelfProtocol deployed to:", await selfProtocol.getAddress());

  // Deploy DareX
  console.log("Deploying DareX...");
  const DareX = await ethers.getContractFactory("DareX");
  const dareX = await DareX.deploy(
    await pyusd.getAddress(),
    await selfProtocol.getAddress(),
    deployer.address // Treasury address
  );
  await dareX.waitForDeployment();
  console.log("DareX deployed to:", await dareX.getAddress());

  // Setup verification for deployer
  console.log("Setting up identity verification...");
  await selfProtocol.setVerified(deployer.address, true);
  
  // Mint some PYUSD to deployer for testing
  console.log("Minting test PYUSD...");
  await pyusd.mint(deployer.address, ethers.parseEther("10000"));
  
  // Approve DareX to spend PYUSD
  await pyusd.approve(await dareX.getAddress(), ethers.parseEther("10000"));

  console.log("Deployment completed!");
  console.log("DareX address:", await dareX.getAddress());
  console.log("MockPYUSD address:", await pyusd.getAddress());
  console.log("MockSelfProtocol address:", await selfProtocol.getAddress());

  // Save deployment addresses to a file for frontend integration
  const addresses = {
    dareX: await dareX.getAddress(),
    pyusd: await pyusd.getAddress(),
    selfProtocol: await selfProtocol.getAddress()
  };

  const fs = require('fs');
  fs.writeFileSync('config/deployment.json', JSON.stringify(addresses, null, 2));
  console.log("Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });