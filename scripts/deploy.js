const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // --- SETUP ---
  // Get multiple signers for testing different roles
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Deployer account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // --- DEPLOYMENT ---
  console.log("\nDeploying DareXModular...");
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

  // --- MOCK TEST 1: CREATE A DARE ---
  console.log("\n--- Mock Test: Creating Initial Dare ---");
  const mockReward = ethers.parseEther("0.00002");
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;
  const mockDeadline = Math.floor(Date.now() / 1000) + sevenDaysInSeconds;
  let mockDareId;

  try {
    const tx = await dareXModular.createDare(
      "Code a Tailwind UI Component",
      "Create a responsive, aesthetically pleasing UI card using Tailwind CSS in one file.",
      mockReward,
      mockDeadline,
      { value: mockReward } // CRITICAL: Must send the reward amount as ETH value
    );

    console.log(`Create Dare transaction sent: ${tx.hash}`);
    await tx.wait(); // Wait for 1 confirmation
    console.log("Dare 'Code a Tailwind UI Component' created successfully! 🎉");

    mockDareId = await dareXModular.dareCount();
    console.log(`Total Dares on Contract: ${mockDareId}`);

    const dare = await dareXModular.dares(mockDareId);
    console.log(`Verification: Dare ${mockDareId} title is "${dare.title}"`);
    
  } catch (error) {
    console.error("FAILED TO CREATE DARE:", error.message);
    // If dare creation fails, we cannot proceed.
    process.exit(1);
  }

  // --- MOCK TEST 2: SUBMIT PROOF ---
  console.log("\n--- Mock Test: Submitting Proof ---");
  const mockProofCID = "QmXG42X...EXAMPLE_CID_HERE...Yt9kce3vY";

  try {
    const tx = await dareXModular.connect(deployer).submitProof(
        mockDareId,
        mockProofCID
    );
    console.log(`Submit Proof transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log(`Proof submitted successfully by ${deployer.address} for Dare ID ${mockDareId}! 📝`);

    // Verification
    const submissions = await dareXModular.getSubmissions(mockDareId);
    if (submissions.length > 0 && submissions[0].participant === deployer.address) {
        console.log(`Verification: Submission found for Dare ${mockDareId} from the correct participant.`);
        console.log(`  -> Proof CID: ${submissions[0].proofCID}`);
    } else {
        console.error("Verification FAILED: Submission not found or participant address is incorrect.");
    }

  } catch (error) {
      console.error("FAILED TO SUBMIT PROOF:", error.message);
  }


  // --- SAVE DEPLOYMENT INFO ---
  console.log("\nDeployment completed successfully! ✅");
  console.log("------------------------------------");
  console.log("DareXModular address:", dareXModularAddress);
  console.log("RewardDistribution address:", rewardDistributionAddress);
  console.log("------------------------------------");

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
