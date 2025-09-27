const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DareChain", function () {
  let dareChain;
  let pyusd;
  let selfProtocol;
  let owner, user1, user2, user3, treasury;

  beforeEach(async function () {
    [owner, user1, user2, user3, treasury] = await ethers.getSigners();

    // Deploy mock contracts
    const MockPYUSD = await ethers.getContractFactory("MockPYUSD");
    pyusd = await MockPYUSD.deploy();
    
    const MockSelfProtocol = await ethers.getContractFactory("MockSelfProtocol");
    selfProtocol = await MockSelfProtocol.deploy();

    // Deploy DareChain
    const DareChain = await ethers.getContractFactory("DareChain");
    dareChain = await DareChain.deploy(
      pyusd.target,
      selfProtocol.target,
      treasury.address
    );

    // Setup verification for test users
    await selfProtocol.setVerified(owner.address, true);
    await selfProtocol.setVerified(user1.address, true);
    await selfProtocol.setVerified(user2.address, true);
    await selfProtocol.setVerified(user3.address, true);

    // Mint PYUSD to users
    await pyusd.mint(user1.address, ethers.parseEther("1000"));
    await pyusd.mint(user2.address, ethers.parseEther("1000"));
    await pyusd.mint(user3.address, ethers.parseEther("1000"));

    // Approve DareChain to spend PYUSD
    await pyusd.connect(user1).approve(dareChain.target, ethers.parseEther("1000"));
    await pyusd.connect(user2).approve(dareChain.target, ethers.parseEther("1000"));
    await pyusd.connect(user3).approve(dareChain.target, ethers.parseEther("1000"));
  });

  describe("Dare Creation", function () {
    it("Should create a new dare", async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      await expect(
        dareChain.connect(user1).createDare(
          "Test Dare",
          "Test Description",
          reward,
          deadline
        )
      ).to.emit(dareChain, "DareCreated");

      const dare = await dareChain.dares(1);
      expect(dare.creator).to.equal(user1.address);
      expect(dare.reward).to.equal(reward);
      expect(dare.completed).to.be.false;
    });

    it("Should fail if user not verified", async function () {
      await selfProtocol.setVerified(user1.address, false);
      
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400;

      await expect(
        dareChain.connect(user1).createDare(
          "Test Dare",
          "Test Description",
          reward,
          deadline
        )
      ).to.be.revertedWith("Identity not verified");
    });
  });

  describe("Proof Submission", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await dareChain.connect(user1).createDare(
        "Test Dare",
        "Test Description",
        reward,
        deadline
      );
    });

    it("Should submit proof for a dare", async function () {
      await expect(
        dareChain.connect(user2).submitProof(1, "QmProofCID123")
      ).to.emit(dareChain, "DareSubmitted");

      const submission = await dareChain.submissions(1);
      expect(submission.participant).to.equal(user2.address);
      expect(submission.proofCID).to.equal("QmProofCID123");
    });

    it("Should fail if creator tries to participate", async function () {
      await expect(
        dareChain.connect(user1).submitProof(1, "QmProofCID123")
      ).to.be.revertedWith("Creator cannot participate");
    });
  });

  describe("Betting", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await dareChain.connect(user1).createDare(
        "Test Dare",
        "Test Description",
        reward,
        deadline
      );
      
      await dareChain.connect(user2).submitProof(1, "QmProofCID123");
    });

    it("Should place a bet on dare success", async function () {
      const betAmount = ethers.parseEther("5");
      
      await expect(
        dareChain.connect(user3).placeBet(1, betAmount, true)
      ).to.emit(dareChain, "BetPlaced");

      const dare = await dareChain.dares(1);
      expect(dare.totalBetAmount).to.equal(betAmount);
      expect(dare.successBetAmount).to.equal(betAmount);
    });
  });

  describe("Dare Completion", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 100; // Short deadline
      
      await dareChain.connect(user1).createDare(
        "Test Dare",
        "Test Description",
        reward,
        deadline
      );
      
      await dareChain.connect(user2).submitProof(1, "QmProofCID123");
      
      // Wait for deadline to pass
      await ethers.provider.send("evm_increaseTime", [200]);
      await ethers.provider.send("evm_mine");
    });

    it("Should complete dare successfully", async function () {
      await expect(
        dareChain.connect(user1).completeDare(1, true)
      ).to.emit(dareChain, "DareCompleted");

      const dare = await dareChain.dares(1);
      expect(dare.completed).to.be.true;
      expect(dare.winner).to.equal(user2.address);
    });
  });
});