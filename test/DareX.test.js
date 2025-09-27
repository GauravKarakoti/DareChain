const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DareX", function () {
  let dareX;
  let owner, user1, user2, user3, treasury;

  beforeEach(async function () {
    [owner, user1, user2, user3, treasury] = await ethers.getSigners();

    // Deploy DareX
    const DareX = await ethers.getContractFactory("DareXModular");
    dareX = await DareX.deploy(
      treasury.address
    );
  });

  describe("Dare Creation", function () {
    it("Should create a new dare", async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

      await expect(
        dareX.connect(user1).createDare(
          "Test Dare",
          "Test Description",
          reward,
          deadline
        )
      ).to.emit(dareX, "DareCreated");

      const dare = await dareX.dares(1);
      expect(dare.creator).to.equal(user1.address);
      expect(dare.reward).to.equal(reward);
      expect(dare.completed).to.be.false;
    });
  });

  describe("Proof Submission", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 86400;
      
      await dareX.connect(user1).createDare(
        "Test Dare",
        "Test Description",
        reward,
        deadline
      );
    });

    it("Should submit proof for a dare", async function () {
      await expect(
        dareX.connect(user2).submitProof(1, "QmProofCID123")
      ).to.emit(dareX, "DareSubmitted");

      const submission = await dareX.submissions(1);
      expect(submission.participant).to.equal(user2.address);
      expect(submission.proofCID).to.equal("QmProofCID123");
    });

    it("Should fail if creator tries to participate", async function () {
      await expect(
        dareX.connect(user1).submitProof(1, "QmProofCID123")
      ).to.be.revertedWith("Creator cannot participate");
    });
  });

  describe("Dare Completion", function () {
    beforeEach(async function () {
      const reward = ethers.parseEther("10");
      const deadline = Math.floor(Date.now() / 1000) + 100; // Short deadline
      
      await dareX.connect(user1).createDare(
        "Test Dare",
        "Test Description",
        reward,
        deadline
      );
      
      await dareX.connect(user2).submitProof(1, "QmProofCID123");
      
      // Wait for deadline to pass
      await ethers.provider.send("evm_increaseTime", [200]);
      await ethers.provider.send("evm_mine");
    });

    it("Should complete dare successfully", async function () {
      await expect(
        dareX.connect(user1).completeDare(1)
      ).to.emit(dareX, "DareCompleted");

      const dare = await dareX.dares(1);
      expect(dare.completed).to.be.true;
      expect(dare.winner).to.equal(user2.address);
    });
  });
});